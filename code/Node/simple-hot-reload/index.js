'use strict'
const fs = require('fs')

fs.watch('server.js', function (evt, file) {
  console.log(evt, file)
  console.log('我好像变化了')
})