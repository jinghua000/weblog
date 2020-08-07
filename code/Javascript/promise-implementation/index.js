// const { MyPromise } = require('./my-promise')
const MyPromise = Promise

function test1 () {
  console.log('start promise')

  new MyPromise(resolve => {
    console.log('first')
    // 同步resolve
    resolve('second')

  // 同步then
  }).then(data => {
    // 直接返回
    return data
  }).then(data => {
    console.log(data)

    return new MyPromise(resolve => {
      setTimeout(() => {
        // 异步resolve
        resolve('third')
      }, 300)
    })

  }).then(data => {
    console.log(data)
  })

  console.log('end promise')
}

function test2 () {
  let p1 = new MyPromise(resolve => resolve('hello'))

  setTimeout(() => {
    // 如果实现Promise的是微任务 这里的setTimeout打印会后执行 否则会先执行
    setTimeout(() => console.log('outside promise'))
    // 异步then
    p1.then(data => data + ' world').then(console.log)
  })
}

// test1()
test2()