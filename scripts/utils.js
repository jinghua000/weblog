const f = require('shadow-fns')

const deepCompact = f.filter(f.opposite(f.isEmpty))
const getFolderName = f.pipe(f.split('/'), deepCompact, f.last)

module.exports = {
  getFolderName,
}