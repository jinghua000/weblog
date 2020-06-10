// external deps
const socket = require('socket.io')
const chokidar = require('chokidar')
const express = require('express')
const memfs = require('memfs').fs

// internal deps
const path = require('path')
const child_procss = require('child_process')
const http = require('http')

// custom deps
const { repack, generatePayload } = require('./pack')
const { SOURCE_DIR, OUT_DIR, BUNDLE_FILE_PATH } = require('./shared')

const server = http.createServer()
const io = socket(server)

function socketServer () {
  io.on('connection', client => {
    
    // 如果前端发送完全刷新的信号，则打包之后再通知前端刷新
    client.on('full-reload', () => {
      repack()
      io.emit('reload')
    })

  })

  server.listen(3001, () => {
    console.log('socket server start')
  })
}

function watchEvents (watchDir) {
  chokidar.watch(watchDir).on('change', (path, status) => {

    console.log('file change:', path)

    // 当文件变化时，把 文件 以及 文件的打包代码 传递到前端
    io.emit('hmr', {
      key: path,
      payload: generatePayload(path),
    })

  })
}

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