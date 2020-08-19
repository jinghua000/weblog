'use strict'

const curry = fn => {
  const curried = (...args) => 
    args.length < fn.length
      ? (...args2) => curried(...args, ...args2)
      : fn(...args)
  return curried
}

const add = (a, b) => a + b
const newAdd = curry(add)

console.log(newAdd(1, 2))
console.log(newAdd(1)(2))

function foo (a, b) {
  this.a = a
  this.b = b
}

const obj = {}
const newFoo = curry(foo.bind(obj))

newFoo(1)(2)

console.log(obj.a) // => 1
console.log(obj.b) // => 2