# promise-implementation (手动实现Promise)

## 目标

于是来实现一个[Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)吧。

## 准备

在那之前需要确定一下我们的`Promise`要实现到什么程度，这里我们选择按照[Promises/A+标准](https://promisesaplus.com/)来实现，同时这个标准也有相应的[测试用例](https://github.com/promises-aplus/promises-tests)。

## 开始

按照标准，我们知道首先`Promise`有3个状态。然后会有一些比如`value`，`status`之类的属性去储存那些。

然后我们也知道`Promise`最常用的方式就是`then`的链式调用，可以有许多成功调用和失败调用，于是我们肯定还需要两个队列来储存`成功回调`和`失败回调`。

基础代码如下

```js
'use strict'

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
  }
}
```

我们先不着急去完善这个构造函数，继续看`Promise`的一些特性。

按照标准[2.2](https://promisesaplus.com/#the-then-method)看，首先最明显的他有一个`then`方法，我们先来定义`then`方法的内容。

```js
function then (onFulfilled, onRejected) {
  // then 方法接收一个成功回调和一个失败回调
  // 返回一个Promise
  const promise = new this.constructor((resolve, reject) => {

  })

  return promise
}
```

然后`then`方法如果`Promise`是`fulfilled`的状态则执行成功回调，是`rejected`的状态则执行失败回调。另外最重要的，`then`是可以链式调用的，按照标准[2.2.7.1](https://promisesaplus.com/#point-41)，上述两个回调执行完成后，再执行`[[Resolve]](promise, x)`，这个函数是链式调用的关键，于是我们假装有一个`resolvePromise(promise, value)`函数。

`then`的逻辑如下

```js
// function then
// ...

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
```

这里`then`里面的所有任务全部使用了`setTimeout`，这是为了模拟异步，按照标准[3.1](https://promisesaplus.com/#point-67)，`onFulfilled`和`onRejected`均为异步执行，在`then`方法调用后调用，而实现异步的方式标准上允许使用`宏任务(macro-task)`或者`微任务(micro-task)`。但是我们在v8引擎下（比如chrome下）使用的`Promise`均为微任务，所以此处的`Promise`实现虽然符合标准，但是和原生的还是有略微不同。

好了，接下来就是实现另外一个重要函数`resolvePromise`，这个函数的描述也占用了整个[2.3](https://promisesaplus.com/#the-promise-resolution-procedure)的标准描述。

不过在那之前我们先准备几个工具函数，为了结构清晰。

```js
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
```

好的，接下来就可以来实现`resolvePromise`了，这个函数的实现相当复杂，具体可以看代码注释以及对比标准。

```js
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
```

然后在此之后，我们最后再来完善我们的构造函数。

```js
// MyPromise constructor
// ...

    try {
      executor(
        value => resolvePromise(this, value),
        reason => handleRejected(this, reason),
      )
    } catch (err) {
      handleRejected(this, err)
    }
```

在一个`Promise`对象创建了之后应该马上就会调用传递的函数，然后尝试`resolvePromise`，有异常则`reject Promise`。

然后因为我们需要进行测试，按照测试用例的要求，需要暴露一个`deferred`方法，并设定`promise`,`resolve`和`reject`属性。

```js
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
```

我这里为了方便就先全局安装了测试依赖，执行测试用例看看。

```
promises-aplus-tests my-promise.js
```

最后输出

```
  872 passing (16s)
```

可喜可贺，872个测试用例全部通过了。

完整的代码

```js
'use strict'

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
```

## 总结

好了，这次顺利的实现了`Promise`。然而事实并不是这样，虽然看上去按照标准组合一下就好了但是实际写代码的时候经常各种测试用例通不过，很多地方要反复尝试，参考了各种其他的`polyfill`得到适合自己的思路最后才能勉强写出来，不过这样一来也终于加深了对`Promise`的理解，一些参考的内容放在了最下方。

## 参考

- [Promises/A+标准](https://promisesaplus.com/)
- [promises-tests](https://github.com/promises-aplus/promises-tests)
- [es6-promise](https://github.com/stefanpenner/es6-promise)
- [Promise的源码实现（完美符合Promise/A+规范）](https://juejin.im/post/6844903796129136654)
- [相关代码](../../code/Javascript/promise-implementation/my-promise.js)