'use strict'

const obj = {
  foo: 'Foo',
  bar: 'Bar',
}

function demo (key1, key2) {
  console.log(this[key1])
  console.log(this[key2])
}

// demo.call(obj, 'foo', 'bar') // => 'Foo', 'Bar'

Function.prototype.mycall = function (context, ...args) {
  const key = Symbol() // 创建一个和别的key不会重复的key
  context[key] = this // 使得上下文的一个属性指向当前函数
  const result = context[key](...args) // 在上下文的环境下调用函数
  delete context[key] // 删除之前设置的key
  return result // 返回结果
}

Function.prototype.myapply = function (context, args = []) {
  return this.mycall(context, ...args)
}

Function.prototype.mybind = function (context, ...args) {
  return (...args2) => this.mycall(context, ...args, ...args2)
}

demo.mycall(obj, 'foo', 'bar')
demo.myapply(obj, ['foo', 'bar'])
demo.mybind(obj, 'foo')('bar')
demo.mybind(obj, 'foo').mybind(globalThis).mycall(globalThis, 'bar')
