'use strict'

const http = require('http')
const fs = require('fs')
const path = require('path')
const etag = require('etag')

const server = http.createServer((req, res) => {
  const body = fs.readFileSync(path.join(__dirname, 'index.html'))
  const serverTag = etag(body)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // res.setHeader('Expires', new Date('2000-01-01'))
  // res.setHeader('Expires', new Date('2077-01-01'))
  // res.setHeader('Cache-Control', 'max-age=3600')
  res.setHeader('Cache-Control', 'max-age=0')
  res.setHeader('ETag', serverTag)

  if (req.headers['if-none-match'] === serverTag) {
    res.statusCode = 304
    res.end()
  } else {
    res.end(body)
  }
})

server.listen('3001', () => {
  console.log('sever run on http://127.0.0.1:3001')
  require('child_process').exec('open http://127.0.0.1:3001')
})