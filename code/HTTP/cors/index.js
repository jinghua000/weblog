'use strict'

const http = require('http')

const server = http.createServer((req, res) => {
  console.log(req.method)

  // 当然这里也可以设置成客户端的地址
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, My-Header');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, PATCH');
  res.setHeader('Access-Control-Max-Age', '10');

  // 如果是options类型的请求则返回空
  if (req.method === 'OPTIONS') {
    res.end()
  } else {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ a: 123 }))
  }
})

server.listen(3001, () => {
  console.log('sever run on http://127.0.0.1:3001')
})