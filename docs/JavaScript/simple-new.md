# simple-new (new的简易实现)

## 是什么

[new](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)是一种`js`中的操作符。

为了更好的理解他，尝试来手动实现一下他。

```js
function mynew (target, ...args) {
  return Reflect.construct(target, args)
}
```

好的，实现完了，这次的分享到此结束，大家下次再见。

什么？这不是你想要的结果，好吧，那我们来一步步实现。

## 思路整理

`new`操作符在运行类似`new Foo(...)`的代码时执行了以下几步。

1. 创建一个对象继承`Foo.prototype`。
2. 把所有参数传递给构造函数`Foo`，并且把构造函数的`this`指向刚刚**步骤1**创建的对象。
3. 如果**步骤2**的返回结果是一个对象，则返回这个对象，否则返回**步骤1**创建的对象。

知道了上面这几点实现起来就很方便了。

## 实现

```js
function mynew (target, ...args) {
  // return Reflect.construct(target, args)
  const obj = Object.create(target.prototype)
  const result = target.apply(obj, args)
  return result !== null && typeof result === 'object'
    ? result
    : obj
}
```

一共3行代码，3行分别对应之前思路整理中的3条，当然处于仅了解原理以及方便考虑，并没有进行一些边界判断。

然后进行测试一下。

```js
'use strict'

function Animal (name) {
  this.name = name
}

Animal.prototype.eat = function () { return true }

const rabbit = mynew(Animal, 'rabbit')
console.log(rabbit.name) // => rabbit
console.log(rabbit.eat()) // => true
```

当然对于返回值是对象的函数也是没有问题的。

```js
function Foo () { return { foo: 123 } }

console.log(mynew(Foo)) // => { foo: 123 }
```

## 总结

只要对`new`操作符内部的执行流程有一个清晰认知的话就很容易实现了。

## 参考

- [MDN new](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)
- [相关代码](../../code/JavaScript/simple-new.js)
