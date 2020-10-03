# object-create (Object.create的简易实现)

## 是什么

[`Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)相当于是以传入的对象为原型创建一个新的对象，那么来简单的整理一下设置原型的方法好了。

> 当然Object.create的第二个参数类似于Object.defineProperties的参数，那个暂时就不考虑了。

## 实现

**方法1**

可以直接通过设置`__proto__`来改变，当然[**不推荐**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto)这样，我们知道有这个东西就行了。

```js
function create (obj) {
  const newObj = {}
  newObj.__proto__ = obj
  return newObj
}
```

**方法2**

设置原型最明确的方法应该是使用`Object.setPrototypeOf`，方法名上也很明确，也可以使用`Reflect.setPrototypeOf`。

```js
function create (obj) {
  const newObj = {}
  Object.setPrototypeOf(newObj, obj)
  // Reflect.setPrototypeOf(newObj, obj)
  return newObj
}
```

但是这样相当于新建了一个对象然后把原型强行改成我们传入的对象，相当于修改了原型链，是一种相当`慢`的操作，MDN上也[**不推荐**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf)这样。

**方法3**

那么除了原生的`Object.create`，`new`操作符也是可以创建对象的同时设置原型的。

```js
function create (obj) {
  function f () {}
  f.prototype = obj
  return new f()
  // return Reflect.construct(f, []) 
}
```

`new`对象的时候，把构造函数的`prototype`属性设置为了新对象的原型，所以可以利用这个特性创建原型链，当然使用`Reflect.construct`也可以。

**测试**

```js
const foo = {}
const bar = create(foo)
console.log(Object.getPrototypeOf(bar) === foo) // => true
```

看上去没什么问题。

## 总结

总而言之是对于js基础知识的一点整理，了解就好。

## 参考

- [Object.create()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [相关代码](../../code/Javascript/object-create.js)