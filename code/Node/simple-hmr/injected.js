const exportsMap = new Map()
const installedModulesMap = new Map()
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

  })
})

// 用递归的方式取得一个文件以及所在集合中与此文件有关联的文件
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
  // 如果已经加载过的文件则直接返回他的 exports 对象
  if (installedModulesMap.get(filename)) {
    return installedModulesMap.get(filename).exports
  }

  const [fn, mapping] = modules[filename]

  function require (dep) {
    return __require__(mapping[dep])
  }

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

  const module = {
    // 创建一个 hot 对象
    hot: createHot(mapping),
    exports,
  }

  // 设置为已加载的文件
  installedModulesMap.set(filename, module)

  fn(require, module, exports)

  return exports
}
