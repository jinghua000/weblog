'use strict'

const express = require('express')
const app = express()

app.listen(8989, () => {
  console.log('listening on port 8989!')
})

app.get('/hello', function (req, res) {
  res.send('f**k you!')
})