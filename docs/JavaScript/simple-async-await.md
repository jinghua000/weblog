# simple-async-await (async/await的简易实现)

## 是什么

`async`是一种为了让异步操作变的更方便的一种语法，也是`Generator`的语法糖。今天来尝试实现一个简单的`async`函数。

## 准备

先用`async`, `await`来实现一个简单的异步函数。

```js
function asyncfn (data) {
    return new Promise(res => setTimeout(res, 300, data))
}

;(async function (x) {
    let a = await asyncfn(x)
    let b = await asyncfn(x + 1)
    return a + b
})(20).then(console.log) // after 600ms: 41
```

`await`的特点之一就是让异步编程看上去和同步编程一样。

我们知道`async`是基于`Generator`实现的，相当于把`*`换成`async`，`yield`换成`await`，然后最后返回一个`Promise`，那么如果是上面的例子大概可以写成以下这样。

```js
myasync(function* (x) {
    let a = yield asyncfn(x)
    let b = yield asyncfn(x + 1)
    return a + b
})(10).then(console.log) // after 600ms: 21
```

因为`yield`和`await`是少有的JS中有**暂停**效果的方法，上面的例子理论上完全可以做到，这样之后就我们只要考虑如何实现`myasync`函数就好了。

## 实现

大致的思路就是，执行`Generator`函数的`next`方法，如果全部结束则`resolvePromise`，否则继续调用`next`。

```js
function myasync (fn) {
    // 返回一个包装用的函数
    return function (...args) {
        // 返回Promise
        return new Promise(resolve => {
            const gen = fn(...args)
            
            function next (data) {
                // 调用Generator函数的next方法
                const result = gen.next(data)

                // 如果done为true则resolvePromise
                if (result.done) {
                    return resolve(result.value)
                }
                
                // 否则等待结果执行完成继续调用
                result.value.then(next)
            }
            
            return next()
        })
    }
}
```

当然这样的实现没有考虑边界条件，只是简单的了解一下实现的方式，测试一下，成功的打印出了想要的结果，可喜可贺。

## 总结

通过简单的实现了解了`async`大概是怎么样作为`Generator`的语法糖的，虽然只是一个简单的递归倒也有所收获。事实上这样的设计很早就出现了，参考[co](https://github.com/tj/co)这个库。

## 参考

- [async 函数](https://es6.ruanyifeng.com/#docs/async)
- [相关代码](../../code/JavaScript/simple-async-await.js)