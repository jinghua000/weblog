const express = require('express')
const compression = require('compression')
const app = express()

app.use(compression())
app.use(express.static('./'))

app.listen(8081, () => {
  console.log('listening on port 8081!')
  console.log('http://localhost:8081')
})