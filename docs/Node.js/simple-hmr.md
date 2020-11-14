# simple-hmr (类似webpack模块热替换的简单实现)

> 这篇文章使用到了[`webpack打包的基本原理`](./simple-pack.md)以及[`客户端热重载的简单实现`](./simple-client-hot-reload.md)中的大量内容，重复部分将不在这篇文章中详细展开。

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
    console.log('something change!')
    
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

这一步就是将所有`src/`里的`js`文件打包成一个`入口js文件`，参考之前的文章[`webpack打包的基本原理`](./simple-pack.md)。

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

  // 将一些注入的代码提取到了外部的文件中
  const result = `
(function(modules) {

${readCode('./injected.js')}

__require__("${queue[0].filename}");

})({${modules}})
`

  return result
}
```

> injected.js

```js
function __require__ (filename) {
  const [fn, mapping] = modules[filename]

  function require (dep) {
    return __require__(mapping[dep])
  }

  const exports = {}
  const module = {
    exports,
  }

  fn(require, module, exports)

  return exports
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

### 2. 静态页面、WebSocket服务

根据我们的需要，我们需要一个`WebSocket`服务来让页面与服务端交互，具体的可以参考之前的文章[`客户端热重载的简单实现`](./simple-client-hot-reload.md)。

需要注意的是在之前的文章里我们是通过直接在静态页面注入代码，但是这次因为我们直接是生成的打包的文件，所以注入代码就更为轻松了。

在之前的`pack.js`最后生成的代码中的这一段。

```js
// ...
  const result = `
(function(modules) {

${readCode('./injected.js')}

__require__("${queue[0].filename}");

})({${modules}})
`
```

在`injected.js`里写我们想要注入的代码就好了。

> injected.js

```js
// 加载socket.io的依赖
new Promise(resolve => {
  const element = document.createElement('script')
  element.setAttribute('src', '__socket_path__')
  element.onload = resolve

  document.body.appendChild(element)
}).then(() => {
  const socket = window.io('http://127.0.0.1:3001')

  socket.on('connect', () => {

    // 监听刷新事件
    socket.on('reload', () => {
      window.location.reload()
    })

  })
})
```

这次我们依然也使用了[socket.io](https://socket.io/)作为`WebSocket`依赖，动态的加载依赖之后先注册一个刷新事件。

而对于服务器端，就是代理输出文件夹的静态页面，启动`WebSocket`服务，具体的细节和之前的文章一样，这里只做简单介绍。

> server.js

启动一个简单的`WebSocket`服务。

```js
const server = http.createServer()
const io = socket(server)

function socketServer () {
  server.listen(3001, () => {
    console.log('socket server start')
  })
}
```

这里我们先暂时监听到变化就全部打包然后再刷新，之后我们会替换掉这边。

```js
function watchEvents (watchDir) {
  chokidar.watch(watchDir).on('change', (path, status) => {

    console.log('file change:', path)

    repack()
    io.emit('reload')

  })
}
```

代理静态页面服务，以及加载`socket.io`依赖，从内存中加载打包文件。

```js
function staticServer () {
  const app = express()
  app.use(express.static(OUT_DIR))

  app.get(BUNDLE_FILE_PATH, (req, res) => {
    // 从内存中加载不存在的打包文件
    res.send(
      memfs.readFileSync(BUNDLE_FILE_PATH, 'utf-8')
    )
  })

  app.get('/__socket_path__', (req, res) => {
    // 加载socket.io依赖
    res.sendFile(
      path.join(__dirname, './node_modules/socket.io-client/dist/socket.io.dev.js')
    )
  })

  app.listen(3000, () => {
    console.log('static server run on http://localhost:3000')
    child_procss.exec('open http://localhost:3000')
  })
}
```

最后对外暴露一个方法

```js
function run () {
  // 重新打包所有文件
  repack()

  // 静态服务
  staticServer()
  // WebSocket服务
  socketServer()
  // 初始化监听事件
  watchEvents([SOURCE_DIR, OUT_DIR])
}

module.exports = {
  run
}
```

好的，从理论上我们现在已经实现了以下功能
1. 打包`es`形式的`js`代码。
2. 代理静态页面。
3. 当有代码变动的时候，重新打包并刷新页面。

来稍微测试一下。

写一个入口文件

> index.js

```js
const { run } = require('./server')

run()
```

```bash
node .
```

页面上显示

```
this is the body
this is a component with foo and bar
```

看上去成功达成效果了，然后修改任何一个文件都会重新刷新一遍并加载最新的代码。

然后从控制台的`Sources`中也能看到我们的储存在内存中的打包文件。

![`simple-hmr-1`](../../assets/simple-hmr-1.jpg)

好了，上面的内容事实上差不多算是对前两篇文章[`webpack打包的基本原理`](./simple-pack.md)和[`客户端热重载的简单实现`](./simple-client-hot-reload.md)的整合，总而言之先休息一会……  

好了，然后接下来终于要开始实现`hmr`了。

### 3. 注册hmr回调函数

回想一下一开始的代码

```js
// ...

if (module.hot) {
  module.hot.accept('./component', function () {
    console.log('something change!')

    document.body.removeChild(element)
    element = component()
    document.body.appendChild(element)
  })
}
```

这里模仿了`webpack`的接口模式写了一个热更新函数注册，其意义（稍微有点绕）应该是

> 当`./component`以及他的依赖 以及 依赖的依赖（循环）内容发生改变时，重新打包`被改变的文件`，然后重新加载`被改变的文件`， 以及 依赖被改变的文件 的文件，以及依赖 依赖被改变的文件 的文件（循环）。最后加载完最新的代码之后，执行绑定的回调函数。

这样之后看上去能够通过回调函数去局部的执行我们想要执行的代码。

首先按照这个接口的形状来实现第一步

> 把回调函数与`./component`以及他的所有下层依赖做一个绑定

需要修改的是`injected.js`里的`__require__`方法。

> injected.js

```js
// ...

// 储存 热更新回调函数 以及 对应的变化文件数组
const hotMap = new Map()

// 用递归的方式 获得一个文件及其所有下级依赖
function generateDepsArray (filename, deps = []) {
  deps.push(filename)

  const mapping = modules[filename][1]
  const depFiles = Object.values(mapping)

  if (depFiles.length) {
    depFiles.forEach(depFile => {
      generateDepsArray(depFile, deps)
    })
  }

  return deps
}

function createHot (mapping) {
  function accept (dep, callback = () => {}) {
    // 以 回调函数 为 key, 变化文件数组 为 value
    hotMap.set(
      callback, 
      generateDepsArray(mapping[dep])
    )
  }

  return {
    accept,
  }
}

function __require__ (filename) {
  const [fn, mapping] = modules[filename]

  function require (dep) {
    return __require__(mapping[dep])
  }

  const exports = {}
  const module = {
    // 创建一个 hot 对象
    hot: createHot(mapping),
    exports,
  }

  fn(require, module, exports)

  return exports
}
```

好了，现在我们绑定了回调函数以及所有需要监听变化的文件，但是我们还需要服务端通知我们到底是哪个文件变化了，于是接下来修改服务端相关的文件监听代码。

> server.js

```js
function watchEvents (watchDir) {
  chokidar.watch(watchDir).on('change', (path, status) => {

    console.log('file change:', path)

    // 当文件变化时，把 文件 以及 文件的打包代码 传递到前端
    io.emit('hmr', {
      key: path,
      payload: generatePayload(path),
    })

    // 然后再重新打包一次文件保证内存里文件是最新的，不过对前端没有影响
    repack()

  })
}
```

> `generatePayload`是之前定义好的对单个文件的打包方法，可以往上翻一翻。

另外因为我们打包是以`文件路径名`为`modules`的`key`，所以这里就很方便的直接把变化的文件路径传递到前端就行了，然后顺便把文件的打包代码也一起传递，之后会用到。

另外也要考虑一种情况，就是被修改的模块没有被注册热更新，这个时候我们需要全部刷新（即为重新打包再刷新），所以我们给服务器的`WebSocket`再加一个事件。

```js
// ...

  io.on('connection', client => {
    
    // 如果前端发送完全刷新的信号，则打包之后再通知前端刷新
    client.on('full-reload', () => {
      repack()
      io.emit('reload')
    })

  })
```

然后在前端的`WebSocket`做对应的接收处理

> injected.js

```js
// ...

    // 监听hmr事件
    socket.on('hmr', (data) => {
      let hotReload = false

      // 如果在 hotMap 中存在变化的文件则去执行回调函数
      hotMap.forEach((deps, fn) => {
        if (deps.includes(data.key)) {
          hotReload = true
          fn()
        }
      })

      // 如果没有热更新则通知后端需要完整更新
      if (!hotReload) { 
        console.log(' no hot reload ')
        socket.emit('full-reload')
      }
    })
```

好了，这样一来看上去我们把`回调函数`以及`对应的变化文件数组`绑定起来了。

可以去输出一下`hotMap`确认一下，我们这里启动服务后尝试修改一下`./components`下的依赖，以及尝试修改不是其依赖的其他文件，在修改依赖时控制台看到了如下内容。

```
something change!
```

这是我们在回调函数里打印的内容，由此可见回调函数被确实执行了。

而在修改其他文件的时候整个页面则会重新打包并刷新。

但是现在就算回调函数执行了，里面的内容并没有变化。

```js
// ...
    document.body.removeChild(element)
    element = component()
    document.body.appendChild(element)
```

其他的代码还是按照原本的内容，并不是我们修改后的内容执行的，这是必然，毕竟我们还没有加载新的打包代码，所以接下来要进行的就是，模块替换。

### 4. 模块替换

在前端`WebSocket`接收到后台发来的单个文件的打包的内容的时候，我们可以再加一个简单的处理。

```js
// ...

    // 监听hmr事件
    socket.on('hmr', (data) => {
      let hotReload = false
      // 把最新打包的代码替换modules对象
      modules[data.key] = eval(data.payload)

```

因为我们是以文件名为`modules`对象的`key`，所以看上去这一步可以十分方便的执行。

不过即便如此还是没有用，因为`modules`对象虽然变化了，但是在那之前文件已经全部加载完了，所以我们这个时候需要再加载一遍相关文件，也就是对他们分别进行`__require__`方法。

具体我们要加载的文件描述起来应该是

> 被改变的文件，以及 依赖被改变的文件 的文件，以及依赖 依赖被改变的文件 的文件（循环）。

这样加载的话就能把所有相关的文件重新加载而不去加载其他不相关的文件。

但是这样一来就会又涉及到其他问题。

回想一下我们之前`__require__`方法。

```js
// function __require__
// ...

  const exports = {}
  const module = {
    // 创建一个 hot 对象
    hot: createHot(mapping),
    exports,
  }

  fn(require, module, exports)
```

这里我们为了在浏览器环境去模拟加载了`module`和`exports`。

- `module`相当于对单个文件的扩展。

- `exports`相当于单个文件的模块输出。

对于`exports`，我们先来稍微看一下`babel`编译后的`cjs`代码，大概可以表现为以下样子。

```js
var foo = require('./foo').default

// ...
```

这里的`foo`相当于是`./foo`模块`exports`对象的`default`属性，而一个文件模块的执行就相当于去给`exports`对象赋值。

而重新加载就是重新执行`__require__`方法，所以如果每次都新建一个对象，那么旧的对象的属性将不会改变。

而对于`hmr`来说，最终执行回调函数的文件是`不会重新加载`的，取而代之是执行回调函数，所以使用的一定是旧的对象。

所以我们需要把`exports`对象提取到外面而不是每次新建。

```js
const exportsMap = new Map()

// function __require__
// ...

  // 如果存在当前文件的 exports 对象则取得否则新建
  let exports = exportsMap.get(filename)
  if (!exports) {
    exports = {}
    exportsMap.set(filename, exports)
  }

  // 清空对象
  for (let key in exports) { 
    delete exports[key] 
  }
```

这里使用了`Map`不过当然使用普通的对象也可以，总而言之这样一来每个文件的`exports`就都存在了一个固定的地方，多次加载也仅仅只是改变单个对象的属性。

另外一方面因为要重新加载相关文件，那么在加载相关文件的时候相关文件还会再加载自己的依赖，但这事实上是没有必要的，因为所有需要重新加载的文件我们已经确定了，所以我们还需要一个全局的对象去判断一个模块`是否有加载过`。

```js
const installedModulesMap = new Map()

// function __require__
// ...

  // 如果已经加载过的文件则直接返回他的 exports 对象
  if (installedModulesMap.get(filename)) {
    return installedModulesMap.get(filename).exports
  }

  // ...
  const module = {
    // 创建一个 hot 对象
    hot: createHot(mapping),
    exports,
  }

  // 设置为已加载的文件
  installedModulesMap.set(filename, module)
```

好了，这样一来一个模块就只会加载一次不会重复加载了，最后我们在`WebSocket`监听到`hmr`事件的时候去加载需要重新加载的模块。

```js
// ...

    // 监听hmr事件
    socket.on('hmr', (data) => {
      let hotReload = false
      // 把最新打包的代码替换modules对象
      modules[data.key] = eval(data.payload)

      // 如果在 hotMap 中存在变化的文件则去执行回调函数
      hotMap.forEach((deps, fn) => {
        if (deps.includes(data.key)) {
          hotReload = true

          // 获取需要重新加载的文件
          // 变化的文件 以及 依赖了变化的文件的文件 以及 依赖了 依赖了变化的文件的文件 的文件 ...
          const needReloadDeps = generateParentsArray(data.key, deps)
          console.log(
            `following files reloaded: \n- ${needReloadDeps.join('\n- ')}`
          )
          
          needReloadDeps.forEach(dep => {
            // 删除需要加载的文件
            installedModulesMap.delete(dep)
            __require__(dep)
          })

          fn()
        }
      })

      // 如果没有热更新则通知后端需要完整更新
      if (!hotReload) { 
        console.log(' no hot reload ')
        socket.emit('full-reload')
      }
    })

// ...

// 用递归的方式取得一个文件以及所选集合中与此文件有关联的文件
function generateParentsArray (filename, deps = [], parents = []) {
  parents.push(filename)

  deps.filter(
    dep => Object.values(
      modules[dep][1]
    ).includes(filename)
  ).forEach(
    dep => generateParentsArray(dep, deps, parents)
  )

  return parents 
}
```

好了，接下来来测试一下，首先启动服务之后打开`console`看到的是这样的情况。

```
foo loaded
bar loaded
component loaded
index loaded
```

然后稍微修改一下`foo`里面的代码，改变输出值，然后`console`里的改变如下。

```
following files reloaded: 
- src/foo.js
- src/component.js
foo loaded
component loaded
something change!
```

可以看到只有相关的`foo`和`component`两个文件重新加载了，而没有涉及到变化的`bar`并没有加载。

而在页面上，回调函数里的代码也确实用最新的代码执行了，替换掉了原本的`dom`。

```
this is the body
this is a component with foo 123 and bar
```

看上去！这样一来已经实现了一个简单的`hmr`效果。

## 总结

总结一下实现思路就是，打包 -> 代理页面 -> 监听变化 -> 局部打包 -> 模块替换。

说到底这篇文章只是做了一个`hmr`的样子，具体细节还有很多没有完善的地方，不过我们的目的是了解一种`hmr`的实现方式，所以其他那些就不管啦，毕竟真的要用的话可以直接去使用强大的`webpack`。

那么到此为止！

## 参考

- [Hot Module Replacement (HMR)](https://webpack.js.org/concepts/hot-module-replacement/)
- [`webpack打包的基本原理`](./simple-pack.md)
- [`客户端热重载的简单实现`](./simple-client-hot-reload.md)
- [相关代码](../../code/Node.js/simple-hmr)