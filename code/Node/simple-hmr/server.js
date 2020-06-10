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
const { repack } = require('./pack')
const { SOURCE_DIR, OUT_DIR, BUNDLE_FILE_PATH } = require('./shared')

const server = http.createServer()
const io = socket(server)

function socketServer () {
  server.listen(3001, () => {
    console.log('socket server start')
  })
}

function watchEvents (watchDir) {
  chokidar.watch(watchDir).on('change', (path, status) => {

    console.log('file change:', path)

    repack()
    io.emit('event', {
      action: 'reload',
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