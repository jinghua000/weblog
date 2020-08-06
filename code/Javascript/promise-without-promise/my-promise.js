'use strict'

const STATUS = {
  pending: 0,
  resolved: 1,
  rejected: 2,
}

let id = 0

class MyPromise {

  constructor (fn) {
    this.id = id++
    this.status = STATUS.pending
    this.deps = {}
    this.value = undefined
    // console.log('new', this)

    fn(
      data => {
        if (this.status !== STATUS.pending) return
  
        setTimeout(() => {
          // console.log('resolver', this)
          this.value = data
          this.status = STATUS.resolved
          this.deps.resolver && this.deps.resolver(data)
        })
      }
      // ...
    )
  }

  then (resolver, rejecter) {
    return new MyPromise((resolve, reject) => {
      const callback = () => {
        const result = resolver(this.value)

        if (result instanceof MyPromise) {
          result.then(resolve)
        } else {
          resolve(result)
        }
      }

      // console.log('then', this)
      this.deps.resolver = callback
    })
  }

}


module.exports = {
  MyPromise
}