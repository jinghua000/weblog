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

function resolveCallback (data) {
  if (this.status !== STATUS.pending) return

  // process.nextTick(() => {
  setTimeout(() => {
    this.value = data
    this.status = STATUS.resolved
    this.deps.resolver && this.deps.resolver(data)
  })
}

function rejecteCallback (data) {
  if (this.status !== STATUS.pending) return

  setTimeout(() => {
    this.value = data
    this.status = STATUS.rejected
    this.deps.rejecter ? this.deps.rejecter(data) : error(data)
  })
}

class MyPromise {

  constructor (fn) {
    this.id = id++
    this.status = STATUS.pending
    this.deps = {}
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
          this.deps.resolver = succeed
          this.deps.rejecter = failed
          break
        case STATUS.resolved:
          succeed(this.value)
          break
        case STATUS.rejected:
          failed(this.value)
          break  
      }
    })
  }

}

module.exports = {
  MyPromise
}