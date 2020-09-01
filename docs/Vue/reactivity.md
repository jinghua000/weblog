# simple-reactivity (简易reactivity)

## 是什么

reactivity是vue中的响应式系统，[vue3](https://github.com/vuejs/vue-next/tree/master/packages/reactivity)把这个模块分离了出来，于是我们一起来看探究一下。

先来看一个最基本的例子

```js
let dummy
const obj = reactive({ num: 0 })

effect(() => dummy = obj.num)
obj.num = 123

console.log(dummy) // => 123 嗯???
```

不得了！来实现一下吧。

## 思路整理

首先我们都知道vue3是使用[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)代替了[Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)来实现数据劫持的，那么我们对`obj`的属性变动时的处理，也使用一样的方式去实现吧。

然后比如劫持到了`obj`的`set`操作，那么这个时候我们应该去执行一遍对应的`effect`里的函数，既然要这样那可以得出我们在执行`effect`方法的时候必然就会把里面的函数储存在某个地方，并且要和当前对象关联起来。

那要如何关联起来，因为在函数内明显对`obj`执行了`get`操作，于是我们就可以通过劫持`get`关联对象与函数。

这样一来思路就清晰了，那么来开始实现。

## 实现


