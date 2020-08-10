const { MyPromise } = require('./my-promise')

// 测试同步正确流程
function test1 (Promise) {
  console.log('start promise')

  new Promise(resolve => {
    console.log('first')
    // 同步resolve
    resolve('second')

  // 同步then
  }).then(data => {
    // 直接返回
    return data
  }).then(data => {
    console.log(data)

    return new Promise(resolve => {
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

// 测试异步正确流程
function test2 (Promise) {
  let p1 = new Promise(resolve => resolve('hello'))

  setTimeout(() => {
    // 如果实现Promise的是微任务 这里的setTimeout打印会后执行 否则会先执行
    setTimeout(() => console.log('outside promise'))
    // 异步then
    p1.then(data => data + ' world').then(console.log)
  })
}

// 测试错误流程
function test3 (Promise) {
  new Promise((_, reject) => {
    console.log('first')

    // 同步reject
    reject('second')
  }) // 注释以下则抛出同步异常
  .then(null, data => {
    return data
  })
  .then(data => {
    console.log(data)

    return new Promise((_, reject) => {
      setTimeout(() => {
        // 异步reject
        reject('third')
      }, 300)
    })
  }) // 注释以下则抛出异步异常
  .then(null, data => {
    console.log(data)
  })

}

// 测试捕获同步错误, 异步throw错误Promise无法捕获
function test4 (Promise) {
  new Promise(() => {
    throw '123'
  }).then('', console.log)
}

// 特殊情况的Promise resolve
function test5 (Promise) {
  let p1 = arg => new Promise(resolve => setTimeout(resolve, 300, arg))
  new Promise(resolve => resolve(p1('123'))).then(console.log)
}

// test1(MyPromise)
// test1(Promise)

// test2(MyPromise)
// test2(Promise)

// test3(MyPromise)
// test3(Promise)

// test4(MyPromise)
// test4(Promise)

test5(MyPromise)
// test5(Promise)