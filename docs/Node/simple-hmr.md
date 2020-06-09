# simple-hmr (简单模块热替换)

> 这篇文章使用到了[`simple-pack`](./simple-pack.md)以及[`simple-client-hot-reload`](./simple-client-hot-reload.md)中的大量内容，重复部分将不在这篇文章中详细展开。

## 是什么

[Hot Module Replacement (HMR)](https://webpack.js.org/concepts/hot-module-replacement/)，具体的含义可以去看链接里的详细描述，大概就是，当文件发生变化时，通过替换对应的模块而不用重新加载整个页面。

## 为什么

模块热替换只会在开发模式使用，好处的话大概是可以

1. 保留页面状态
2. 节省时间
3. css效果可以直接显示

## 目标

模仿`webpack`来实现一个针对`js`文件的模块热替换（不包括页面样式）。

## webpack是什么样子的

参考`webpack`的[HMR使用指导](https://webpack.js.org/guides/hot-module-replacement/)，截取一些主要代码。

```js
// index.js
// ...

if (module.hot) {
  module.hot.accept('./print.js', function() {
    console.log('Accepting the updated printMe module!');
    document.body.removeChild(element);
    element = component(); 
    document.body.appendChild(element);
  })
}
```

大概的意思就是通过`module.hot.accept`方法，去监听`./print.js`以及其依赖们的变化，变化了之后则用会调用后面的回调函数，而不是全局刷新。

好的，既然知道了最终的样子，我们就来稍微写一点例子把。

## 实现准备

> src/index.js

```js
import { component } from './component'

console.log('index loaded')

let element = component()
document.body.appendChild(element)

if (module.hot) {
  module.hot.accept('./component', function () {
    document.body.removeChild(element)
    element = component()
    document.body.appendChild(element)
  })
}
```

> src/component.js

```js
import foo from './foo'
import bar from './bar'

console.log('component loaded')

export function component () {
  const elem = document.createElement('div')
  elem.innerHTML = 'this is a component with ' + foo + ' and ' + bar

  return elem
}
```

> src/foo.js

```js
console.log('foo loaded')

export default 'foo'
```

> src/bar.js

```js
console.log('bar loaded')

export default 'bar'
```

好了我们准备了一些文件来生成一个`dom`，然后也模仿`webpack`的方式来监听了一下文件的变化尝试来进行热更新，然后我们还需要一个作为首页的`html`文件。

> out/index.html

```html
<body>
  this is the body
</body>
<script src="bundle.js"></script>
```

我们这里引入了一个不存在的`bundle.js`的文件，这个文件是我们到时候打包整个`src/`文件夹生成的入口文件，现在先不管他。

好了，现在素材已经准备好了，可以开始进行下一步了。

## 思路整理

1. 把所有`src/`文件夹里的所有`js`文件打包成一个文件，每个文件当做一个模块。
2. 通过静态服务去代理`out/`下的静态文件以及通过`WebSocket`服务让前端文件与服务端进行关联。
3. 监听所有`src/`下文件的变化，一旦某个文件变化，则去重新打包那个文件，通过`WebSocket`把相关信息传递到前端。
4. 在前端尝试用模块替换更新变化的文件，执行对应的回调函数。
5. 如果没有设置模块替换，则进行全局刷新，即为`window.location.reload()`。

## 开始实现 

### 1. 打包源文件

这一步就是将所有`src/`里的`js`文件打包成一个`入口js文件`，参考之前的文章[`simple-pack`](./simple-pack.md)。

这里仅描述一些需要变化的点。

之前我们在实现打包的时候是基于生产模式的打包，对于每个文件分配独立的`id`去定位文件。但是在开发模式需要重复加载模块的情况下通过自增的`id`去定位文件明显是比较复杂的，所以这里我们把文件的唯一标识符改为`文件路径名`。

另外，假想一下，当一个文件进行修改了之后，对被修改文件进行重新打包操作，而这个时候需要获取的除了文件的源代码以外，还需要获得文件的依赖信息，把标识符修改为`文件路径名`之后也可以不用依赖外部获得相对依赖路径对应的绝对依赖路径。

主要代码

> pack.js

```js
// ...

// 生成某个文件的资源 传入的是完整文件路径
function createAsset (filename) {
  // 获取AST
  const ast = getAst(filename)
  // 获取依赖
  const dependencies = getDeps(ast)
  // 获取源代码
  const code = getCode(ast)
  // 获得当前文件的依赖对应的绝对路径
  const mapping = getDepMap(filename, dependencies)

  return {
    code,
    dependencies,
    filename,
    mapping,
  }
}

function getDepMap (filename, deps) {
  const mapping = {}

  const dirname = path.dirname(filename)
  deps.forEach(dep => {
    mapping[dep] = adaptJS(path.join(dirname, dep))
  })

  return mapping
}
```

这里把依赖的格式变为`相对依赖`: `绝对依赖路径`。

然后在打包的时候，把对应的文件格式进行改变。

```js
function generateAssetKey (asset) {
  return `"${asset.filename}"`
}

function generateAssetPayload (asset) {
  return `[
    function (require, module, exports) { 
      ${asset.code} 
    },
    ${JSON.stringify(asset.mapping)},
  ]`
}

// 以资源的文件名为 key [源代码, 依赖] 的数组为 value
function generateAssetModule (asset) {
  return `${generateAssetKey(asset)}: ${generateAssetPayload(asset)},`
}

function bundle (queue) {
  let modules = ''
  
  // 打包的时候生成每个文件的资源
  queue.forEach(asset => {
    modules += generateAssetModule(asset)
  })

  const result = `
(function(modules) {

${readCode('./injected.js')}

__require__("${queue[0].filename}");

})({${modules}})
`

  return result
}
```

除了文件标识从`自增id`变成了`文件路径名`，这次引入了`module`，对于文件的`api`扩展以及判断模块的加载都有用处，详细的之后再说。

最后因为需要涉及到对单个文件的打包，将代码解耦后提取出一个对文件单独打包的方法，加上对于全体文件的打包，总共暴露两个方法。

```js
// ...

// 源文件入口文件
const ENTRY_FILE = './src/index.js'
// 入口html加载的不存在的js文件
const BUNDLE_FILE_PATH = `/bundle.js`

// 重新打包所有文件
function repack () {
  const content = packing(ENTRY_FILE)

  // 把打包内容写入到内存中
  memfs.writeFileSync(BUNDLE_FILE_PATH, content)
}

// 仅打包一个文件，用于模块替换
function generatePayload (path) {
  return generateAssetPayload(
    createAsset(path)
  )
}

module.exports = {
  repack,
  generatePayload,
}
```

> 另外这次参考了`webpack`的做法利用到了[`memfs`](https://www.npmjs.com/package/memfs)这个库，把打包的内容存在内存里，可以节省一些文件写入读取的消耗。
