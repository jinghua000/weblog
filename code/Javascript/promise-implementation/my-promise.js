'use strict'

const STATUS = {
  pending: 0,
  resolved: 1,
  rejected: 2,
}

let id = 0

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

  // setTimeout(() => {
  //   this.value = data
  //   this.status = STATUS.rejected
  //   this.deps.rejecter && this.deps.rejecter(data)
  // })
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
        const result = resolver(data)

        if (result instanceof MyPromise) {
          result.then(resolve, rejecter)
        } else {
          resolve(result)
        }
      }

      switch (this.status) {
        case STATUS.pending:
          this.deps.resolver = succeed
          break
        case STATUS.resolved:
          succeed(this.value)
          break
      }
    })
  }

}

module.exports = {
  MyPromise
}