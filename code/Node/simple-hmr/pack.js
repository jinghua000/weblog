'use strict'

const path = require('path')
const parser = require('@babel/parser')
const babel = require('@babel/core')
const traverse = require('@babel/traverse').default
const memfs = require('memfs').fs

const { 
  BUNDLE_FILE_PATH, 
  readCode, 
  getDepMap, 
  adaptJS,
} = require('./shared')

function getDeps (ast) {
  const dependencies = []
  traverse(ast, {
    ImportDeclaration (path) {
      dependencies.push(path.node.source.value)
    },
  })

  return dependencies
}

function getCode (ast) {
  return babel.transformFromAst(ast, null, {
    presets: ['@babel/preset-env']
  }).code
}

function getAst (filepath) {
  const content = readCode(filepath)

  return parser.parse(content, {
    sourceType: 'module'
  })
}

// 生成某个文件的资源 传入的是完整文件路径
function createAsset (filename) {
  // 获取AST
  const ast = getAst(filename)
  // 获取依赖
  const dependencies = getDeps(ast)
  // 获取源代码
  const code = getCode(ast)
  // 获得当前文件的依赖对应的绝对路径
  const mapping = getDepMap(filename, dependencies)

  return {
    code,
    dependencies,
    filename,
    mapping,
  }
}

function createGraph (entry) {
  const queue = []

  queue.push(createAsset(entry))

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename)

    asset.dependencies.forEach(dep => {
      const depAsset = createAsset(
        adaptJS(path.join(dirname, dep))
      )

      queue.push(depAsset)
    })
  }

  return queue
}

function generateAssetKey (asset) {
  return `"${asset.filename}"`
}

function generateAssetPayload (asset) {
  return `[
    function (require, module, exports) { 
      ${asset.code} 
    },
    ${JSON.stringify(asset.mapping)},
  ]`
}

// 以资源的文件名为 key [源代码, 依赖] 的数组为 value
function generateAssetModule (asset) {
  return `${generateAssetKey(asset)}: ${generateAssetPayload(asset)},`
}

function bundle (queue) {
  let modules = ''
  
  // 打包的时候生成每个文件的资源
  queue.forEach(asset => {
    modules += generateAssetModule(asset)
  })

  const result = `
(function(modules) {

${readCode('./injected.js')}

__require__("${queue[0].filename}");

})({${modules}})
`

  return result
}

function packing (entry) {
  const queue = createGraph(entry)

  return bundle(queue)
}

// 重新打包所有文件
function repack () {
  const content = packing(ENTRY_FILE)

  // 把打包内容写入到内存中
  memfs.writeFileSync(BUNDLE_FILE_PATH, content)
}

// 仅打包一个文件，用于模块替换
function generatePayload (path) {
  return generateAssetPayload(
    createAsset(path)
  )
}

module.exports = {
  repack,
  generatePayload,
}
