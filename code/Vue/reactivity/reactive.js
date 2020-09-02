'use strict'

const { effectStack } = require('./effect')

const targetMap = new WeakMap()

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

function ref (raw) {
  raw = isObject(raw) ? reactive(raw) : raw

  const wrapper = {
    set value (val) {
      raw = val
      trigger(wrapper, 'value')
    },
    get value () {
      track(wrapper, 'value')
      return raw
    },
  }

  return wrapper
}

function reactive (target) {
  if (!isObject(target)) {
    return target
  }

  return new Proxy(target, handler)
}

const handler = {
  set (target, prop, value) {
    const result = Reflect.set(target, prop, value)
    trigger(target, prop)
    return result
  },
  get (target, prop) {
    const result = Reflect.get(target, prop)
    track(target, prop)
    return isObject(result) ? reactive(result) : result
  },
}

// 通过对象和key来触发绑定的函数
function trigger (target, prop) {
  const depsMap = targetMap.get(target)

  if (!depsMap) { return }

  const deps = depsMap.get(prop) || []
  deps.forEach(fn => fn())
}

// 用来绑定对应的对象的key以及函数
function track (target, prop) {
  if (!effectStack.length) {
    return 
  }

  // 取得对象对应的Map，不存在则创建一个
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 取得属性对应的Set，不存在则创建一个
  let deps = depsMap.get(prop)
  if (!deps) {
    deps = new Set()
    depsMap.set(prop, deps)
  }

  // 将全局的函数加入对应依赖中
  deps.add(effectStack[effectStack.length - 1])
}

module.exports = {
  reactive,
  ref,
}