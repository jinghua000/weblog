function asyncfn (data) {
    return new Promise(res => setTimeout(res, 300, data))
}

;(async function (x) {
    let a = await asyncfn(x)
    let b = await asyncfn(x + 1)
    return a + b
})(20).then(console.log) // after 600ms: 41

myasync(function* (x) {
    let a = yield asyncfn(x)
    let b = yield asyncfn(x + 1)
    return a + b
})(10).then(console.log) // after 600ms: 21

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
