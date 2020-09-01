const f = require('shadow-fns')
const fs = require('fs-extra')

const getFolderName = f.pipe(f.split('/'), f.deepCompact, f.last)

function getBracketsContent (str) {
  return str.match(/\((.*?)\)/g)[0].slice(1, -1).trim()
}

function getFileChineseTitle (file) {
  const firstLineContent = String(fs.readFileSync(file)).split('\n')[0]

  return getBracketsContent(firstLineContent)
}

module.exports = {
  getFolderName,
  getFileChineseTitle,
}