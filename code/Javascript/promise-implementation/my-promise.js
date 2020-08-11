'use strict'

const STATUS = {
  pending: 0,
  resolved: 1,
  rejected: 2,
}

let id = 0

function isFunc (obj) {
  return typeof obj === 'function'
}

function error (err) {
  console.error(`Uncaught Promise Error "${err}"`)
}

function rejectOwn () {
  throw new TypeError("can't resolve own")
}

function resolveCallback (data) {
  if (this.status !== STATUS.pending) return

  const run = () => {
    if (data instanceof MyPromise) {
      data.then(
        resolveCallback.bind(this),
        rejecteCallback.bind(this)
      )
    } else {
      this.value = data
      this.status = STATUS.resolved
      let cb 
      while (cb = this.resolveCallbacks.shift()) {
        cb(data)
      }
    }
  }

  setTimeout(run)
}

function rejecteCallback (data) {
  if (this.status !== STATUS.pending) return

  const run = () => {
    this.value = data
    this.status = STATUS.rejected
    error(data)
    let cb 
    while (cb = this.rejecteCallbacks.shift()) {
      cb(data)
    }
  }

  setTimeout(run)
}

class MyPromise {

  constructor (fn) {
    this.id = id++
    this.status = STATUS.pending
    this.resolveCallbacks = []
    this.rejecteCallbacks = []
    this.value = undefined

    try {
      fn(
        resolveCallback.bind(this),
        rejecteCallback.bind(this)
      )
    } catch (err) {
      rejecteCallback.call(this, err)
    }
    
  }

  then (resolver, rejecter) {
    return new MyPromise((resolve, reject) => {
      const succeed = data => {
        try {
          if (!isFunc(resolver)) {
            resolve(data)
          } else {
            const result = resolver(data)

            if (result instanceof MyPromise) {
              result.then(resolve, reject)
            } else {
              resolve(result)
            }
          }
        } catch (err) {
          reject(err)
        }
      }

      const failed = data => {
        try {
          if (!isFunc(rejecter)) {
            reject(data)
          } else {
            const result = rejecter(data)
            
            if (result instanceof MyPromise) {
              result.then(resolve, reject)
            } else {
              resolve(result)
            }
          }
        } catch (err) {
          reject(err)
        }
      }

      switch (this.status) {
        case STATUS.pending:
          this.resolveCallbacks.push(succeed)
          this.rejecteCallbacks.push(failed)
          break
        case STATUS.resolved:
          setTimeout(succeed, this.value)
          break
        case STATUS.rejected:
          setTimeout(failed, this.value)
          break
      }
    })
  }

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