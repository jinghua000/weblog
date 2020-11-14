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