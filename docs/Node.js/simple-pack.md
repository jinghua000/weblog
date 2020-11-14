# simple-pack (webpack打包的基本原理)

## 前言

我们这次就来了解一下如何做一个类似[`webpack`](https://webpack.js.org/)的简易打包。

> 本文的实现方式大量参考了 https://github.com/ronami/minipack 这个项目。  

## 目标

把一些`es`写法写的文件通过打包让其可以在`node`和`浏览器`环境直接执行。

## 思路整理

因为实在没有思路所以来参考一下`webpack`的实现方式。

根据`webpack`的打包结果(可以在`development`模式下的打包结果中看到)，先忽略里面的具体内容，大概的结构是这样的。

```js
// 自执行函数
(function (modules) {

  // 引入模块的方法
  function require (
    // ...
  ) {
    // ...
  }

  // 引入入口文件
  require(
    //...
  )

})({
  // 每个文件的内容 modules对象
  // ...
})
```

根据这个格式我们来自己实现打包所需要的点是：

- 把`es`的代码转换成`cjs`的代码。
- 读取每个文件的代码，并通过一定格式存放在`modules对象`里。
- 提取出每个文件依赖的内容，并从`modules对象`中加载所需要的内容。
- 因为要在浏览器环境运行，所以需要定义`require`，`exports`等`node`环境存在但是`浏览器`环境不存在的变量。

## 事前准备

先来随便写一点用来被打包的代码。

```js
// index.js
import { hello } from './hello'
import { world } from './world'

console.log(hello + ' ' + world)
```

```js
// hello.js
export const hello = 'simple'
```

```js
// wrold.js
export const world = 'pack'
```

## 依赖整理

在实现之前先来整理一下我们需要的依赖。

不过...在整理依赖之前我们先要学习一个知识点。

> AST（Abstract Syntax Tree）抽象语法树  
> 在计算机科学中，抽象语法树（Abstract Syntax Tree，AST），或简称语法树（Syntax tree），是源代码语法结构的一种抽象表示。它以树状的形式表现编程语言的语法结构，树上的每个节点都表示源代码中的一种结构。之所以说语法是“抽象”的，是因为这里的语法并不会表示出真实语法中出现的每个细节。比如，嵌套括号被隐含在树的结构中，并没有以节点的形式呈现；而类似于 if-condition-then 这样的条件跳转语句，可以使用带有两个分支的节点来表示。（来自：[百度百科](https://baike.baidu.com/item/%E6%8A%BD%E8%B1%A1%E8%AF%AD%E6%B3%95%E6%A0%91)）

可以在[`ast explorer`](https://astexplorer.net/)看到类似的例子。

我们可以借助他来分析代码从而取得文件中依赖的其他文件。

于是我们的整体需要的依赖大概是这样的

- 获取代码的`ast` -> `@babel/parser` `@babel/traverse`
- 从`ast`中提取代码并编译 -> `@babel/core` `@babel/preset-env`

## 实现

于是终于要开始实现了，首先安装需要的依赖。

```bash
yarn add -D @babel/parser @babel/traverse @babel/core @babel/preset-env
```

> 我这里用了`yarn`当然你也可以使用`npm`

```js
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const babel = require('@babel/core')
const traverse = require('@babel/traverse').default

// ...
```

好了，现在准备好了的东西，来开始分步进行实现。

### 1. 获取ast

获取一个文件的`ast`是一切的基础，于是先来写一个这样的函数。

```js
function getAst (filepath) {
  // 根据路径读取文件的内容
  const content = fs.readFileSync(filepath, 'utf-8')

  // 通过`@babel/parser`进行解析，返回`ast`
  return parser.parse(content, {
    sourceType: 'module'
  })
}
```

### 2. 获取源代码

获得了`ast`之后他是一个树状结构，然而要真正执行肯定还是需要其中的源代码，并且同时也需要把`es`写法的代码编译成`cjs`的形式，于是来写下一个函数。

```js
function getCode (ast) {
  // 通过传入的`ast`通过`@babel/core`提供的方法转换成`cjs`代码
  return babel.transformFromAst(ast, null, {
    presets: ['@babel/preset-env']
  }).code
}
```

好了现在有了两个函数，来尝试对`index.js`文件试一下吧。

```js
getCode(getAst('./src/index.js'))
```

输出

```js
"use strict";

var _hello = require("./hello");

var _world = require("./world");

console.log(_hello.hello + ' ' + _world.world);
```

看上去成功的把`es`代码转换成了`cjs`，虽然语法支持了，不过因为还需要依赖现在还是不能直接运行。

### 3. 获得依赖

终于到了`ast`最有用的时候了，我们写一个函数去分析某一个文件的依赖关系。

```js
function getDeps (ast) {
  const dependencies = []

  // 通过`@babel/traverse`解析文件中的`import`
  // 然后返回一个依赖数组
  traverse(ast, {
    ImportDeclaration (path) {
      dependencies.push(path.node.source.value)
    },
  })

  return dependencies
}
```

然后赶快来对入口文件尝试一下。

```js
getDeps(getAst('./src/index.js')) // => [ './hello', './world' ]
```

哦哦！看来我们成功的分析出了入口文件的依赖关系，得知他依赖了另外两个文件，不用自己去正则匹配真是太好了。

### 4. 单个文件结构

回忆一下我们的目的，我们需要把所有文件按照一定结构放入`modules对象`中，先来对单个文件进行这个操作。

```js
let _id = 0

function createAsset (filepath) {
  // 设置一个id作为唯一标识
  const id = _id++
  const ast = getAst(filepath)

  // 整合需要的信息返回一个对象
  return {
    id,
    code: getCode(ast),
    deps: getDeps(ast),
    filepath,
  }
}
```

当我们传入某一个文件给这个函数时，就可以返回一些我们需要的信息，里面的内容就如同上面描述的一样，这里就不再举例。

### 5. 整合所有文件

我们获得了入口文件的数据结构，接下来就是获得入口文件的依赖，以及那些依赖的依赖，以及那些依赖的...（禁止套娃）

```js
function createGraph (entry) {
  // 设定一个队列
  const queue = []

  // 加入入口文件的资源
  queue.push(createAsset(entry))

  // 使用 for...of 进行遍历
  // 在 queue 长度变化后可以直接访问到后续的内容
  for (const asset of queue) {

    // 获得文件夹名字
    const dirname = path.dirname(asset.filepath)

    // 设定一个储存空间去储存依赖关系
    // 数据结构是 key 是 相对依赖名，value 是 id（文件的唯一标识）
    asset.mapping = {}

    asset.deps.forEach(dep => {
      // 获得依赖的全路径
      const filepath = path.join(dirname, dep) 
      // 获得依赖的资源
      const depAsset = createAsset(
        filepath.includes('.js') 
          ? filepath
          : filepath + '.js'
      )

      // 把依赖的 名字为key id为value 设置到父级
      asset.mapping[dep] = depAsset.id

      // 往队列里添加依赖
      // 然后 for...of 会直接去遍历这个依赖
      queue.push(depAsset)
    })
  }

  return queue
}
```

通过上面的代码，我们获取了所有需要的文件的资源集合，大致看上去是这样。

```js
createGraph('./src/index.js')
```

返回

```js
[ { id: 0,
    code: '"use strict";\n\nvar _hello = require("./hello");\n\nvar _world = require("./world");\n\nconsole.log(_hello.hello + \' \' + _world.world);',
    deps: [ './hello', './world' ],
    filepath: './src/index.js',
    mapping: { './hello': 1, './world': 2 } },
  { id: 1,
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.hello = void 0;\nvar hello = \'simple\';\nexports.hello = hello;',
    deps: [],
    filepath: 'src/hello.js',
    mapping: {} },
  { id: 2,
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.world = void 0;\nvar world = \'pack\';\nexports.world = world;',
    deps: [],
    filepath: 'src/world.js',
    mapping: {} } ]
```

由此可见我们已经获得了所有需要的内容，包括所有文件的源代码以及他们之间的依赖关系，接下来就只剩下最后一步了。

### 6. 打包

因为要在浏览器中运行，这里的关键点就是要覆盖掉原本的`require`方法，让`require`变成从`modules对象`中加载代码的操作。

```js
function bundle (graph) {
  // modules对象的代码
  let modules = ''

  graph.forEach(asset => {
    // 遍历所有资源，然后我们以资源id为key，代码以及依赖关系的数组为value
    // 因为我们只需要打包es文件，所以只要设置 `require` 和 `exports` 这两个变量覆盖原本的就可以了
    modules += `${asset.id}: [
      function (require, exports) { ${asset.code} },
      ${JSON.stringify(asset.mapping)},
    ],`
  })

  // 因为我们是以id为key 所以我们需要一个自己的 `requireId` 的方法
  // 然后对于本身的 `require` 方法，通过文件名从对应资源的 `mapping` 中获取真正的id，然后去加载
  // 最后设置一个空对象当做每个模块的 `exports`
  const result = `
(function(modules) {
  function requireId(id) {

    const [fn, mapping] = modules[id];
    
    function require (filename) {
      return requireId(mapping[filename]);
    }

    const exports = {}

    fn(require, exports);

    return exports;
  }

  requireId(0);
})({${modules}})
`

  return result
}
```

好的，看来已经完成了，我们最后传入入口文件来测试一下。

```js
// index.js
console.log(
  bundle(
    createGraph('./src/index.js')
  )
)
```

结果

```js
(function(modules) {
  function requireId(id) {

    const [fn, mapping] = modules[id];
    
    function require (filename) {
      return requireId(mapping[filename]);
    }

    const exports = {}

    fn(require, exports);

    return exports;
  }

  requireId(0);
})({0: [
      function (require, exports) { "use strict";

var _hello = require("./hello");

var _world = require("./world");

console.log(_hello.hello + ' ' + _world.world); },
      {"./hello":1,"./world":2},
    ],1: [
      function (require, exports) { "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hello = void 0;
var hello = 'simple';
exports.hello = hello; },
      {},
    ],2: [
      function (require, exports) { "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.world = void 0;
var world = 'pack';
exports.world = world; },
      {},
    ],})
```

把结果输入到`code.js`，然后执行`code.js`

```bash
node index.js > code.js

node code.js
# => simple pack
```

看上去已经在node环境顺利运行了！接下来试一下浏览器环境。

```bash
echo '<script src="code.js"></script>' > index.html

open index.html
```

打开控制台，如我们所料的打印出了`simple pack`，可喜可贺。

### 7. 多层级测试

好了，我们故意加一个层级，然后故意起相同的名字来测试一下，就像这样。

- src
  - index.js
  - hello.js
  - world.js
  - demo
    - index.js
    - hello.js
    - world.js

最后的测试，也完全没有问题，看上去已经实现了一个简易的打包功能了。

## 总结

这次来稍微实现了一下打包的功能，更加了解了打包的原理，所用的依赖基本都是[babel](https://babeljs.io/)，具体的API详情可以去官网进行了解。

其中比较重要的应该是 `ast` - 抽象语法树，有了他就可以去分析代码结构然后按照想要的方式进行组装了。

## 参考

- https://github.com/ronami/minipack
- [babel](https://babeljs.io/)
- [ast](https://astexplorer.net/)
- [相关代码](../../code/Node.js/simple-pack)