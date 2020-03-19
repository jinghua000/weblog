'use strict'

const FileSet = require('file-set')
const fs = require('fs-extra')
const f = require('shadow-fns')
const path = require('path')
const join = require('current-path-join')
const chalk = require('chalk')
const { link } = require('markdown-utils')

const { getFolderName } = require('./utils')
const fileSet = new FileSet(['./docs/**/*'])
const data = []

console.log(chalk.cyan('start build README.md'))

fileSet.dirs.forEach(dir => {
  data.push(`\n### ${getFolderName(dir)}`)
  console.log(chalk.yellow(`category - ${getFolderName(dir)}`))

  fileSet.files.filter(f.includes(dir)).forEach(file => {

    const fileName = path.basename(file, '.md')
    data.push(`- ${link(fileName, file)}`)
    console.log(chalk.magenta(`article title - ${fileName}`))

  })
})

;(async () => {
  let str = ''

  str += await fs.readFile(join('../static/title.md'), 'utf8')
  str += '  \n'
  str += data.join('  \n')
  
  await fs.writeFile(join('../README.md'), str)

  console.log(chalk.cyan('build completed!'))
})()