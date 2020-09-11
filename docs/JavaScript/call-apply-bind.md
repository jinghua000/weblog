# call-apply-bind (call, apply, bind的简易实现)

## 是什么

`call`，`apply`，`bind`这三个方法都是js中常用的指定上下文的手段，也是就改变`this`。

那么主要问题就是讨论`this`是什么。

不过[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)在js中的使用地点实在是太多了，我们这里只考虑函数内的情况。简单的说，`this`指向当前函数的`执行环境`。

## 参考

- [JavaScript 的 this 原理](https://www.ruanyifeng.com/blog/2018/06/javascript-this.html)
- [MDN this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
