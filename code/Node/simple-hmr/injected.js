// 加载socket.io的依赖
new Promise(resolve => {
  const element = document.createElement('script')
  element.setAttribute('src', '__socket_path__')
  element.onload = resolve

  document.body.appendChild(element)
}).then(() => {
  const socket = window.io('http://127.0.0.1:3001')
  
  socket.on('connect', () => {

    // 监听刷新页面事件
    socket.on('event', (data) => {
      if (data.action === 'reload') {
        return window.location.reload()
      }

    })

  })
})

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
