const f = require('shadow-fns')

const deepCompact = f.deepCompact
const getFolderName = f.pipe(f.split('/'), deepCompact, f.last)

module.exports = {
  getFolderName,
}