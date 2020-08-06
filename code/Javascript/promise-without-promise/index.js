const { MyPromise } = require('./my-promise')

console.log('start promise')

new MyPromise(resolve => {
  console.log('first')

  setTimeout(() => {
    resolve('second')
  }, 100)

}).then(data => {
  console.log(data)

  return new MyPromise(resolve => {
    setTimeout(() => {
      resolve('third')
    }, 300)
  })

}).then(data => {
  console.log(data)
})

console.log('end promise')

// console.log('start promise')

// new Promise(resolve => {
//   console.log('first')

//   setTimeout(() => {
//     resolve('second')
//   }, 300)

// }).then(data => {
//   console.log(data)

//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve('third')
//     }, 300)
//   })

// }).then(data => {
//   console.log(data)
// })

// console.log('end promise')