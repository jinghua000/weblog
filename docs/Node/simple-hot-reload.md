# simple-hot-reload (简单热重载)

## 是什么

就是说改了代码之后不用自己去重启，会有某种方法帮助你重启之类的，然后直接访问到新代码的机制。

## 为什么

至少在开发模式的情况下看上去会方便很多。

## 实现

好的，首先需要说明的是只是一个简单的实现，**方法比较暴力并且不是最优解**，不过姑且能稍微实现类似的效果。

首先来创建一个看上去很简单的[express](http://expressjs.com/)服务吧。

```js
// server.js
'use strict'

const express = require('express')
const app = express()

app.listen(8989, () => {
  console.log('listening on port 8989!')
})

app.get('/hello', function (req, res) {
  res.send('thank you!')
})
```

好了，现在我们执行`node server.js`之后，再访问`http://127.0.0.1:8989/hello`就可以看到`thank you!`了。

然后调皮的小明稍微改变了一下代码。

```js
// ...
res.send('f**k you!')
```

哦，这实在是太有意思了让我们再试着访问相同的链接。

但是，很遗憾，得到的还是`thank you!`，这明显不是我们想要的结果，我们不得不停止我们的服务再执行一次`node server.js`。

好吧，我们整理一下，我们希望我们在把`thank you!`改成`f**k you!`的时候能够不用去做其他的事情就能让访问到的结果进行变化。

### 第一步

我们需要的是什么，没错，我们需要的是`监听文件的变化`，于是我们来写一段简单的代码，通过node自带的[`fs.watch`](https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener)。

```js
// index.js
'use strict'
const fs = require('fs')

fs.watch('server.js', function (evt, file) {
  console.log(evt, file)
  console.log('我好像变化了')
})
```

好的，先执行`node .`, 然后我们尝试在`server.js`去点几下保存，在控制台里就可以看到。

```
change server.js
我好像变化了
change server.js
我好像变化了
change server.js
我好像变化了
```

看来我们完成了第一步，能够顺利的`监听文件变化`了。

### 第二步

在监听到文件变化之后，我们需要在监听的回调函数里帮我们做成这样一件事情。

> 关闭之前的服务，启动一个新的服务。

没错，总而言之就是要让他重启，所以我们这里需要引入一个[`child_process`](https://nodejs.org/api/child_process.html)（子进程），来运行真正的服务，然后在文件变化的时候，就可以随心所欲的操作他了！

我们把`index.js`文件进行改写。

```js
// index.js
'use strict'
const fs = require('fs')
const { spawn } = require('child_process')

// 启动一个服务
function server () {
  return spawn('node', ['server.js'])
}

function run () {

  // 子进程
  const subprocess = server()
  // 一个文件观察者
  const watcher = fs.watch('server.js', function (evt, file) {
    console.log(evt, file)
    console.log('我好像变化了')
    // 一旦有变化就重启服务
    restart()
  })

  // 正常输出
  subprocess.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
  })
  
  // 错误输出
  subprocess.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
  })
  
  // 重启服务
  function restart () {
    console.log('---start restart---')
    // 关闭本次文件监听
    watcher.close()
    // 关闭子进程
    subprocess.kill()
    // 再次启动一个新服务以及监听
    run()
  }

}

run()
```

然后我们如果改一改代码保存一下访问一下，console里就会是类似这种样子。


```
stdout: listening on port 8989!

stdout: request hello

stdout: request hello

change server.js
我好像变化了
---start restart---
stdout: listening on port 8989!

change server.js
我好像变化了
---start restart---
stdout: listening on port 8989!

stdout: request hello
```

然后我们的每次文件操作，都相当于他先结束原本的子进程，然后再执行了一遍`node server.js`，于是就实现了更改代码不用自己重启马上生效的效果！