'use strict'

const debounce = (ms, fn) => {
  let timer = null

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(fn, ms, ...args)
  }
}

const fn1 = () => console.log('我要举手回答问题')
const debounceFN = debounce(500, fn1)

debounceFN()
debounceFN()
debounceFN()

const throttle = (ms, fn) => {
  let timer = null
  let result

  return (...args) => {
    if (timer !== null) return result

    timer = setTimeout(() => timer = null, ms)
    result = fn(...args)

    return result
  }
}

const schedule = []
const fn2 = girl => { schedule.push(girl); return schedule }
const throttleFN = throttle(500, fn2)

throttleFN('girl1')
throttleFN('girl2')
throttleFN('girl3')

setTimeout(() => {
  throttleFN('girl4')
  throttleFN('girl5')
  throttleFN('girl6')

  console.log(schedule)
}, 600)