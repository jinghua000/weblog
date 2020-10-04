# proxy-and-defineproperty (Proxy与Object.defineProperty的区别)

## 是什么

起因还是vue3把响应式的内部实现从[`Object.defineProperty`](https://developer.mozilla.org/tr/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)修改为了[`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)，于是来了解一下这两者的区别吧。

## 准备

于是先来实现两个劫持对象属性的方法。

> Object.defineProperty

```js
function define (obj) {
  const keys = Object.keys(obj)

  keys.forEach(key => {
    let value 

    Object.defineProperty(obj, key, {
      set (val) {
        console.log(`define: set key - ${key}, val - ${val}`)
        value = val
      },
      get () {
        console.log(`define: get key - ${key}`)
        return value
      },  
    })
  })

  return obj
}
```

> Proxy

```js
function proxy (obj) {
  return new Proxy(obj, {
    set (target, prop, value, receiver) {
      console.log(`proxy: set key - ${prop}, val - ${value}`)
      return Reflect.set(target, prop, value, receiver)
    },
    get (target, prop, receiver) {
      console.log(`proxy: get key - ${prop}`)
      return Reflect.get(target, prop, receiver)
    },
  })
}
```

## 区别

**区别1**

区别1是从API上就能体现出来的了，`Proxy`可以拦截许多操作，除了`set`，`get`还可以拦截比如删除操作`deleteProperty`，判断是否是属性操作`has`等等，相当于功能本身就比较多了。

**区别2**

从代码实现上可以看到，`Object.defineProperty`是针对对象的一个属性进行操作，而`Proxy`是针对对象本身进行拦截的。

这样带来的最直接的变化是，新的属性`Proxy`可以检测到但是`Object.defineProperty`不行。

```js
let obj1 = define({})
let obj2 = proxy({})
obj1.foo = 123 // => 什么都没有
obj2.foo = 123 // => proxy: set key - foo, val - 123
```

**区别3**

对于数组，`Object.defineProperty`对于下标的变化和上面说的类似，如果是原本存在的下标定义则可以监测到，不存在则不行，当然`Proxy`都可以。

```js
let arr1 = define([1,2,3])
let arr2 = proxy([1,2,3])
arr1[0] = 4 // define: set key - 0, val - 4
arr1[4] = 5
arr2[0] = 4 // proxy: set key - 0, val - 4
arr2[4] = 5 // proxy: set key - 4, val - 5
```

不过另外比较重要的一点是`Proxy`比起`Object.defineProperty`可以对数组修改自身的方法进行监测，比如`push`，`pop`，`reverse`，`sort`这种，这个就很厉害了，来看一下这个情况。

```js
arr1.push(10) // => 什么都没有
arr2.push(10)
// proxy: get key - push
// proxy: get key - length
// proxy: set key - 5, val - 10
// proxy: set key - length, val - 6
```

## 总结

其实说区别一共有哪几条也是比较主观的评价，总而言之对于`vue3`来说上述的区别直接导致的就是不用在去在意响应式对象的属性到底是否有定义过以及对数组的特殊操作了。

之前用的`Vue.set`以及`vm.$set`这样的方法已经仅在[vue2兼容版本](https://v3.vuejs.org/guide/migration/global-api-treeshaking.html#affected-apis)存在了。

## 参考

- [`Object.defineProperty`](https://developer.mozilla.org/tr/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [相关代码](../../code/JavaScript/proxy-and-defineproperty.js)
