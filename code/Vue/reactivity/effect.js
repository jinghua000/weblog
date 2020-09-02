'use strict'

// 全局储存函数的区域
const effectStack = []

function effect (fn) {
  function tmp () {
    // 先在全局储存函数，再执行函数，再移除
    effectStack.push(fn)
    fn()
    effectStack.pop()
  }

  tmp()

  return tmp
}

module.exports = {
  effectStack,
  effect,
}