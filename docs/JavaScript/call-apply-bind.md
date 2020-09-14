# call-apply-bind (call, apply, bind的简易实现)

## 是什么

`call`，`apply`，`bind`这三个方法都是js中常用的指定上下文的手段，也是就改变`this`。

那么主要问题就是讨论`this`是什么。

不过[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)在js中的使用地点实在是太多了，我们这里只考虑函数内的情况。简单的说，`this`指向当前函数的`执行环境`。

比如有一个函数`fn`。

```js
function fn () { console.log(this) }
window.fn = fn 
window.fn() // => 执行环境为window

const obj = {}
obj.fn = fn 
obj.fn() // => 执行环境为obj
```

用通俗的语言说就是，调用函数的环境就是执行环境，然后具体到实例的话。

```js
'use strict'

const obj = {
  foo: 'Foo',
  bar: 'Bar',
}

function demo (key1, key2) {
  console.log(this[key1])
  console.log(this[key2])
}

demo.call(obj, 'foo', 'bar') // => 'Foo', 'Bar'
```

`call`把`obj`里的`this`改变成了`demo`，然后取到其两个`key`自然就是`foo`和`bar`了。

## 实现

根据上面的结论，我们主要目标就是形成一种类似`context[key] = fn`的格式，知道了这点之后就很容易可以实现了。

```js
Function.prototype.mycall = function (context, ...args) {
  const key = Symbol() // 创建一个和别的key不会重复的key
  context[key] = this // 使得上下文的一个属性指向当前函数
  const result = context[key](...args) // 在上下文的环境下调用函数
  delete context[key] // 删除之前设置的key
  return result // 返回结果
}
```

大致的思路就和注释所说的一样，创建一个自定义的属性去指向函数，那么再调用函数的时候自然就把上下文改变成了我们设置的上下文。

> 当然我们这里只是为了了解原理，出于方便考虑，没有去管其他边界条件之类的了。

然后按照这个思路`apply`实现起来也很简单。

```js
Function.prototype.myapply = function (context, args = []) {
  return this.mycall(context, ...args)
}
```

然后接下来的`bind`也是同理，`bind`相当于返回一个绑定了上下文和部分参数的函数，因此我们只要使用一个闭包把参数储存下来就可以了。

```js
Function.prototype.mybind = function (context, ...args) {
  return (...args2) => this.mycall(context, ...args, ...args2)
}
```

> 原生的`bind`有一种非常特殊的用法，在`new`的时候会把`this`指向给`bind`返回的函数，不过这个用法并不推荐，详情可以参考[`MDN bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。

其他情况下`bind`只要绑定过一次之后上下文就不会改变了，这其实很好理解，因为我们`context`在第一次`bind`的时候就被闭包在了返回的函数内，之后再怎么其他改变上下文最终还是会执行到我们初始的`context`，所以并不会有影响。

然后基于一开始的例子测试一下我们自己写的几个函数。

```js
demo.mycall(obj, 'foo', 'bar') // => 'Foo', 'Bar'
demo.myapply(obj, ['foo', 'bar']) // => 'Foo', 'Bar'
demo.mybind(obj, 'foo')('bar') // => 'Foo', 'Bar'
```

可见并没有问题，包括对于`bind`后的函数尝试再次改变上下文。

```js
demo.mybind(obj, 'foo').mybind(globalThis).mycall(globalThis, 'bar') // => 'Foo', 'Bar'
```

并没有影响，虽然多次尝试再改变上下文但是仍然使用了第一次的上下文。

## 总结

说到底重要的还是`this`的指向，弄清楚`this`指向的规则就可以让函数使用起来更灵活了。

## 参考

- [JavaScript 的 this 原理](https://www.ruanyifeng.com/blog/2018/06/javascript-this.html)
- [MDN this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [MDN bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [相关代码](../../code/JavaScript/call-apply-bind.js)