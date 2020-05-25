// external deps
const express = require('express')
const socket = require('socket.io')
const chokidar = require('chokidar')

// internal deps
const path = require('path')
const child_procss = require('child_process')
const fs = require('fs')
const http = require('http')

// 需要注入的代码
const INJECTED_CODE = fs.readFileSync(path.join(__dirname, 'injected.html'), 'utf-8')
// socket.io 前端依赖路径
const SOCKET_PATH = path.join(__dirname, './node_modules/socket.io-client/dist/socket.io.dev.js')
// 把所有客户端对象存在一个 Set 里
const clientSockets = new Set()

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

function socketServer () {
  const server = http.createServer()
  const io = socket(server)

  io.on('connection', client => {
    // 连接时加入储存
    clientSockets.add(client)
    console.log('client connected', clientSockets.size)

    // 断开时从储存中删除
    client.on('disconnect', () => {
      clientSockets.delete(client)
      console.log('client disconnected', clientSockets.size)
    })
  })

  server.listen(3001, () => {
    console.log('socket server start')
  })
}

function watchEvents (entry) {
  // 这里只是简单的监听一下变化事件
  chokidar.watch(entry).on('change', () => {

    // 去给所有客户端发送WebSocket消息
    clientSockets.forEach(client => client.emit('event', {
      action: 'reload'
    }))

  })
}

watchEvents('./src')

socketServer()
staticServer('./src')