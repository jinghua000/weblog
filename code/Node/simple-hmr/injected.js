// 储存 热更新回调函数 以及 对应的变化文件数组
const hotMap = new Map()

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

  })
})

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
