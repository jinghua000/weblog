const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const babel = require('@babel/core')
const traverse = require('@babel/traverse').default
let _id = 0

function getAst (filepath) {
  // 根据路径读取文件的内容
  const content = fs.readFileSync(filepath, 'utf-8')

  // 通过`@babel/parser`进行解析，返回`ast`
  return parser.parse(content, {
    sourceType: 'module'
  })
}

function getCode (ast) {
  // 通过传入的`ast`通过`@babel/core`提供的方法转换成`cjs`代码
  return babel.transformFromAst(ast, null, {
    presets: ['@babel/preset-env']
  }).code
}

function getDeps (ast) {
  const dependencies = []

  // 通过`@babel/traverse`解析文件中的`import`
  // 然后返回一个依赖数组
  traverse(ast, {
    ImportDeclaration (path) {
      dependencies.push(path.node.source.value)
    },
  })

  return dependencies
}

function createAsset (filepath) {
  // 设置一个id作为唯一标识
  const id = _id++
  const ast = getAst(filepath)

  // 整合需要的信息返回一个对象
  return {
    id,
    code: getCode(ast),
    deps: getDeps(ast),
    filepath,
  }
}

function createGraph (entry) {
  // 设定一个队列
  const queue = []

  // 加入入口文件的资源
  queue.push(createAsset(entry))

  // 使用 for...of 进行遍历
  // 在 queue 长度变化后可以直接访问到后续的内容
  for (const asset of queue) {

    // 获得文件夹名字
    const dirname = path.dirname(asset.filepath)

    // 设定一个储存空间去储存依赖关系
    // 数据结构是 key 是 相对依赖名，value 是 id（文件的唯一标识）
    asset.mapping = {}

    asset.deps.forEach(dep => {
      // 获得依赖的全路径
      const filepath = path.join(dirname, dep) 
      // 获得依赖的资源
      const depAsset = createAsset(
        filepath.includes('.js') 
          ? filepath
          : filepath + '.js'
      )

      // 把依赖的 名字为key id为value 设置到父级
      asset.mapping[dep] = depAsset.id

      // 往队列里添加依赖
      // 然后 for...of 会直接去遍历这个依赖
      queue.push(depAsset)
    })
  }

  return queue
}

function bundle (graph) {
  // modules对象的代码
  let modules = ''

  graph.forEach(asset => {
    // 遍历所有资源，然后我们以资源id为key，代码以及依赖关系的数组为value
    // 因为我们只需要打包es文件，所以只要设置 `require` 和 `exports` 这两个变量覆盖原本的就可以了
    modules += `${asset.id}: [
      function (require, exports) { ${asset.code} },
      ${JSON.stringify(asset.mapping)},
    ],`
  })

  // 因为我们是以id为key 所以我们需要一个自己的 `requireId` 的方法
  // 然后对于本身的 `require` 方法，通过文件名从对应资源的 `mapping` 中获取真正的id，然后去加载
  // 最后设置一个空对象当做每个模块的 `exports`
  const result = `
(function(modules) {
  function requireId(id) {

    const [fn, mapping] = modules[id];
    
    function require (filename) {
      return requireId(mapping[filename]);
    }

    const exports = {}

    fn(require, exports);

    return exports;
  }

  requireId(0);
})({${modules}})
`

  return result
}

console.log(
  bundle(
    createGraph('./src/index.js')
  )
)

