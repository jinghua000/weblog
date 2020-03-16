# debounce-and-throttle (防抖与节流)

## 是什么

- `debounce`（防抖） 一个操作连续（单次）执行时，只有当一段时间内不再执行他之后，才会执行他一次。
- `throttle`（节流） 一段时间内最多执行一次某个操作。

好吧，举个例子

- `debounce`（防抖） 小明承诺在没有人举手回答问题之后10秒钟举手，但是其他人纷纷连续举手回答问题，结果一节课下来小明最终没有机会举手，小明很聪明，学学小明。
- `throttle`（节流） 小明一天只和一个美少女进行约会，星期一有10个美少女来找他，星期二有20个美少女来找他，但是小明一天只和一个美少女进行约会，小明很专一，学学小明。

> [lodash文档的参考文章](https://css-tricks.com/debouncing-throttling-explained-examples/)

## 为什么

当然是为了降低操作的频率，在合适的情况下使用这两种内容吧！

## 实现

### debounce

在看了上面的描述之后实现一个防抖函数不是分分钟的事。

```js
// 第一个参数是 - 等待多少毫秒之后执行
// 第二个参数是 - 真正需要执行的函数
const debounce = (ms, fn) => {
  let timer = null

  // 看到了吗
  // 每次都设定一个定时器延迟ms秒执行
  // 每次都清除上次设定的定时器
  // excited!
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(fn, ms, ...args)
  }
}
```

> 注意：这里去掉了令人厌烦的`this`，这个函数是不能保留上下文的。

开始测试吧

```js
const fn1 = () => console.log('我要举手回答问题')
const debounceFN = debounce(500, fn1)

debounceFN()
debounceFN()
debounceFN()

// => 最终等了500ms后：我要举手回答问题
```

即便执行很多次，也只有在最后一次执行的500ms后才真正的执行了原始的函数！

### throttle

在看了上面的描述之后实现一个节流函数也是十分容易的。

```js
// 第一个参数是 - 多少毫秒之内最多执行一次
// 第二个参数是 - 真正需要执行的函数
const throttle = (ms, fn) => {
  let timer = null
  let result

  // 每次去执行一个函数的时候
  // 都会同时设置一个定时器
  // 如果定时器正在运行中 则 返回上次的结果
  // 如果定时器已经消失了 则 再执行一次并再设定一个定时器
  return (...args) => {
    if (timer !== null) return result

    timer = setTimeout(() => timer = null, ms)
    result = fn(...args)

    return result
  }
}
```

> 注意：同样，这里去掉了`this`，这个函数是不能保留上下文的。

测试

```js
const schedule = []
const fn2 = girl => schedule.push(girl)
// 相当于每500ms最多把一个girl加入schedule中
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

// => 最终600ms之后，schedule中只有: ['girl1', 'girl4']
// 只有两个人被成功的安排上了
```

## 总结

想必大概已经完全清楚了这两个函数所表达的意义，途中例子给出的实现方式是来自[shadow-fns](https://github.com/jinghua000/shadow-fns)这个函数库，再说一遍注意例子的实现方法是不能绑定上下文的，如果需要绑定请先使用[`bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。

防抖和节流的真实使用途径大概在以下情况：

- 在用户输入一段时间后发送ajax请求
- 在鼠标 移动/滚动 之类的高频率触发的函数时给予限制

## 参考

- [相关代码](../../code/Javascript/debounce-and-throttle.js)
