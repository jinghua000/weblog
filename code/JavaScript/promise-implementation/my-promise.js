'use strcit'

const STATUS = {
  pending: 0,
  fulfilled: 1,
  rejected: 2,
}

let id = 0

class MyPromise {

  constructor (executor) {
    // 加个id用来分辨
    this.id = id++
    // 状态，默认为pending
    this.status = STATUS.pending
    // 成功值
    this.value = undefined
    // 失败值
    this.reason = undefined
    // 成功队列
    this.succeedQueues = []
    // 失败队列
    this.failedQueues = []

    try {
      executor(
        value => resolvePromise(this, value),
        reason => handleRejected(this, reason),
      )
    } catch (err) {
      handleRejected(this, err)
    }
  }
}

MyPromise.prototype.then = then
function then (onFulfilled, onRejected) {
  // then 方法接收一个成功回调和一个失败回调
  // 返回一个Promise
  const promise = new this.constructor((resolve, reject) => {

    const succeed = () => {
      try {
        // 不是函数则忽略
        if (!isFunc(onFulfilled)) {
          resolve(this.value)
        } else {
          // 把onFulfilled的结果以及新的promise作为参数去调用resolvePromise
          resolvePromise(promise, onFulfilled(this.value))
        }
      } catch (err) {
        reject(err)
      }
    }

    const failed = () => {
      try {
        if (!isFunc(onRejected)) {
          reject(this.reason)
        } else {
          resolvePromise(promise, onRejected(this.reason))
        }
      } catch (err) {
        reject(err)
      }
    }

    switch (this.status) {
      // 如果是pending则放进队列等待执行
      case STATUS.pending:
        this.succeedQueues.push(() => setTimeout(succeed))
        this.failedQueues.push(() => setTimeout(failed))
        break
      // 如果是fulfilled则执行成功回调
      case STATUS.fulfilled:
        setTimeout(succeed)
        break
      // 如果是rejected则执行失败回调
      case STATUS.rejected:
        setTimeout(failed)
        break
    }
  })

  return promise
}

function resolvePromise (promise, value) {
  // 2.3.1 promise和value的值不能完全相等
  if (promise === value) {
    throw new TypeError("can't resolve self")
  }

  // 2.3.3 如果值是对象或者函数, 这个条件包括了是Promise
  if (isObjOrFunc(value)) {
    // 2.3.3.3.3 这里需要记录一个used，当任何成功失败回调调用后，后续调用应该忽略
    let then, used

    // 2.3.3.2 如果读取then属性的时候异常则reject
    try {
      then = value.then
    } catch (err) {
      handleRejected(promise, err)
      return
    }

    if (isFunc(then)) {

      try {
        // 2.3.3.3 执行then的call方法，以value为第一个参数
        then.call(
          value,
          // 2.3.3.3.1 成功回调
          val => {
            if (used) return
            used = true
            resolvePromise(promise, val)
          }, 
          // 2.3.3.3.2 失败回调
          err => {
            if (used) return
            used = true
            handleRejected(promise, err)
          }
        )
        // 2.3.3.3.4 异常处理
      } catch (err) {
        if (!used) {
          used = true
          handleRejected(promise, err)
        }
      }

    } else {
      // 2.3.3.4 如果then不是函数，则fulfill Promise
      if (!used) {
        used = true
        handleFulfilled(promise, value)
      }
    }
  } else {
    // 2.3.4 如果值不是对象或者函数，则fulfill Promise
    handleFulfilled(promise, value)
  }
}

// 处理成功状态
function handleFulfilled (promise, value) {
  if (promise.status !== STATUS.pending) return 
  
  // 设定状态，值，以及执行成功回调
  promise.status = STATUS.fulfilled
  promise.value = value
  promise.succeedQueues.forEach(fn => fn())
}

// 处理失败状态
function handleRejected (promise, reason) {
  if (promise.status !== STATUS.pending) return 

  // 设定状态，值，以及执行失败回调
  promise.status = STATUS.rejected
  promise.reason = reason
  promise.failedQueues.forEach(fn => fn())
}

function isFunc (obj) {
  return typeof obj === 'function'
}

function isObjOrFunc (obj) {
  const type = typeof obj

  return obj !== null && (type === 'function' || type === 'object')
}

module.exports = {
  MyPromise,
  deferred: () => {
    const result = {}

    result.promise = new MyPromise((resolve, reject) => {
      result.resolve = resolve
      result.reject = reject
    })

    return result
  },
}