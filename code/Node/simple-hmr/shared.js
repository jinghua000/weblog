const path = require('path')
const fs = require('fs')

// 源文件入口文件
const ENTRY_FILE = './src/index.js'
// 入口html加载的不存在的js文件
const BUNDLE_FILE_PATH = `/bundle.js`
// 源文件路径
const SOURCE_DIR = './src'
// 输出路径
const OUT_DIR = './out'

function readCode (filepath) {
  return fs.readFileSync(filepath, 'utf-8')
}

function adaptJS (filepath) {
  return filepath.includes('.js') 
    ? filepath
    : filepath + '.js'
}

function getDepMap (filename, deps) {
  const mapping = {}

  const dirname = path.dirname(filename)
  deps.forEach(dep => {
    mapping[dep] = adaptJS(path.join(dirname, dep))
  })

  return mapping
}

module.exports = {
  SOURCE_DIR,
  OUT_DIR,
  ENTRY_FILE,
  BUNDLE_FILE_PATH,
  adaptJS,
  readCode,
  getDepMap,
}