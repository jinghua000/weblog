# simple-client-hot-reload (客户端热重载的简单实现)

## 是什么/为什么

比如前端改了代码之后不是要刷新一下页面才能有反应但这个明显是在开发的时候非常不舒服的行为，于是来了解一下如何做到简单的前端热重载。

现有的库类似[webpack-dev-server](https://github.com/webpack/webpack-dev-server)，[live-server](https://github.com/tapio/live-server)都有类似的效果，当然他们的功能都更为强大。

> 我们这次要做的仅仅只是代码变化`reload`前端页面，并不包括[模块替换](https://webpack.js.org/concepts/hot-module-replacement/)，那么开始吧。

## 目标

修改一些静态HTML代码，然后页面会自己刷新。

## 思路整理

可以参考一下之前[simple-hot-reload](./simple-hot-reload.md)这个文章。

先来把思路整理一下好了。首先需要去启动一个服务去代理原有的`静态文件`，然后同时监听这些文件，一旦文件有`变化`，则通知`前端页面`进行刷新。

所以说想要实现这个效果，肯定有些东西是必须需要的。

1. 监听文件的变化 —— 虽然也可以通过原生的`fs`，不过我们这次使用[chokidar](https://github.com/paulmillr/chokidar)来实现吧。
2. 监听到文件变化通知前端重新加载 —— 肯定要使用`WebSocket`，我们这里稍微借用一下[socket.io](https://socket.io/)这个库好了。
3. 代理静态HTML —— 需要注意的是我们还需要向HTML里注入一些代码，毕竟本身的页面是不会有我们需要的`WebSocket`的，我们这里就使用广泛使用的[express](http://expressjs.com/)吧。

## 事先准备

先创建一些静态HTML吧。

> src/index.html

```html
<body>
  i am main page
</body>
<script src="./index.js"></script>
```

> src/index.js

```js
function component () {
  const el = document.createElement('div')
  
  el.innerHTML = 'something else...'
  
  return el
}

document.body.appendChild(component())
```

然后我们访问`index.html`页面上显示了

```
i am main page
something else...
```

看上去前置条件已经准备好了。

## 实现

首先来安装依赖！

```
yarn add -D express chokidar socket.io
```

根据我们上面的思路整理，先来实现代理静态文件的服务代码吧，然而需要注意的是我们是通过注入一些`WebSocket`代码来实现服务端通知前端刷新，所以要先写一些需要注入的代码。

> 下面的代码会省略一些理所当然的引用代码注意，完整代码请参考源代码。

### 注入代码

```html
<!-- injected.html -->
<!-- 因为依赖socket.io，所以姑且先给个标识之后替换掉吧 -->
<script src="$__socket_path__$"></script>
<script>
  var socket = io('http://127.0.0.1:3001')
  socket.on('connect', function () {

    socket.on('event', function (data) {
      // 如果收到 action 为 reload 的事件则刷新页面
      data.action === 'reload' && window.location.reload()
    })

  })
</script>
```

然后姑且先定义一下需要注入的代码以及依赖的路径

```js
// 需要注入的代码
const INJECTED_CODE = fs.readFileSync(path.join(__dirname, 'injected.html'), 'utf-8')
// socket.io 前端依赖路径
const SOCKET_PATH = path.join(__dirname, './node_modules/socket.io-client/dist/socket.io.dev.js')
```

好了，现在得到了需要注入的代码，接下来就是要先代理静态页面，然后对所有HTML页面注入需要的代码。

### 静态服务

```js
// 静态服务
function staticServer (entry, index = 'index.html') {
  const app = express()

  app.use(function (req, res, next) {
    let filePath

    // 如果匹配到 $__socket_path__$ 则去读取依赖文件路径
    // 否则就读取对应路径的静态文件，默认入口为 index.html
    if (req.path.includes('$__socket_path__$')) {
      filePath = SOCKET_PATH
    } else {
      filePath = path.join(__dirname, entry, req.path === '/' ? index : req.path)
    }

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')

      // 如果是 html 文件则往里面注入一段代码
      // 因为只是做例子所以使用了简单的正则匹配
      path.extname(filePath) === '.html'
        ? res.send(fileContent.replace('</body>', `${INJECTED_CODE}</body>`))
        : res.send(fileContent)
    } else {
      res.status(404).end()
    }

    next()
  })

  app.listen(3000, () => {
    console.log('static server run on http://localhost:3000')
    child_procss.exec('open http://localhost:3000')
  })
}

staticServer('./src')
```

好了我们写了一个简单的静态服务，因为只是做例子所以肯定一些没有考虑到的情况但是先不管那些了！然后顺便也测试一下多层级，在原本的`src`目录下再创建一个`foo/foo.html`文件。

> src/foo/foo.html

```html
<body>
  i am foo
</body>
<script src="../index.js"></script>
```

这里还引用了上层的js文件来测试层级，然后执行`node .`来看一下效果。

> http://localhost:3000

```
i am main page
something else...
```

> http://localhost:3000/foo/foo.html

```
i am foo
something else...
```

哦哦，看上去完全没有问题，控制台报了`WebSocket`链接不上的错误也证明我们的依赖文件也成功加载了。

于是我们开始进行下一步，写一个`WebSocket`服务。

### WebSocket服务

```js
const server = http.createServer()
const io = socket(server)

function socketServer () {
  io.on('connection', () => {
    console.log('client connected!')
  })

  server.listen(3001, () => {
    console.log('socket server start')
  })
}

socketServer()
```

好了我们现在写好了一个简易的`WebSocket`服务，然后我们再执行`node .`访问页面的时候，切换到`NetWork` `WS`那一栏已经可以看到链接建立了，接下来就是要去使用他 —— 监听文件变化的时候去刷新前端页面。

### 监听文件

```js
function watchEvents (entry) {
  // 这里只是简单的监听一下变化事件
  chokidar.watch(entry).on('change', () => {

    // 给所有客户端发送WebSocket消息
    io.emit('event', {
      action: 'reload'
    })

  })
}

watchEvents('./src')
```

我们写了一个简单的监听文件变化的函数，然后对所有客户端发送`刷新`的消息。

## 测试

好的，看上去完成了，设置好 `静态服务` `WebSocket服务` `监听事件` 后，理论上已经可以联通了，执行`node .`，访问 http://localhost:3000

```
i am main page
something else...
```

然后去改变一下`index.html`文件，执行保存。

```
i am main page 123
something else...
```

哦哦，看上去成功的达到了效果。

然后我们再开一个新页面 http://localhost:3000/foo/foo.html

再去改变`index.js`里的代码，执行保存之后，两个页面全部都刷新了！

```
i am main page 123
something else... www
```

```
i am foo
something else... www
```

## 总结

这次简单的实现了一个前端热重载的效果，当然因为只是为了做例子，使用的是最基本的实现方式，还有很多逻辑没有判断到。不过这样一来，大概也知道了数据的流动形式了，总而言之就是 `启动两个服务 -> 通过WebSocket把前后端结合起来`，可喜可贺。

并且实际开发中，比较常用的还是[模块热替换(hot-module-replacement)](https://webpack.js.org/concepts/hot-module-replacement/)，有兴趣的话可以去了解一下。

## 参考

- https://github.com/webpack/webpack-dev-server
- https://github.com/tapio/live-server
- [相关代码](../../code/Node/simple-client-hot-reload)
