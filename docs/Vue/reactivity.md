# simple-reactivity (简易reactivity)

## 是什么

`reactivity`是`vue`中的响应式系统，[vue3](https://github.com/vuejs/vue-next/tree/master/packages/reactivity)把这个模块分离了出来，于是我们一起来看探究一下。

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

首先我们都知道`vue3`是使用[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)代替了[Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)来实现数据劫持的，那么我们对`obj`的属性变动时的处理，也使用一样的方式去实现吧。

然后比如劫持到了`obj`的`set`操作，那么这个时候我们应该去执行一遍`effect`里的函数，既然要这样那可以得出我们在执行`effect`方法的时候必然就会把里面的函数储存在某个地方，并且要和当前对象的某个`key`关联起来。

那要如何关联起来，因为在函数内明显对`obj`执行了`get`操作，于是我们就可以通过劫持`get`关联对象与函数。

这样一来思路就清晰了，那么来开始实现。

## 实现

首先来使用`Proxy`写一个拦截器。

> reactive.js

```js
'use strict'

const handler = {
  set (target, prop, value) {
    const result = Reflect.set(target, prop, value)
    trigger(target, prop)
    return result
  },
  get (target, prop) {
    const result = Reflect.get(target, prop)
    track(target, prop)
    return result
  },
}

// 通过对象和key来触发绑定的函数
function trigger (target, prop) {

}

// 用来绑定对应的对象的key以及函数
function track (target, prop) {

}
```

通过之前的思路整理我们轻松的写出了这样的结构，接下来就是要考虑`对象`，`对象的某个属性`，`函数`这三个量如何关联起来。这里我们可以使用一个全局的`WeakMap`结构去储存对象与其子内容的关联，而内部结构因为属性是字符串，所以就再用一个`Map`去储存属性和函数的关联，而一个属性可能绑定了多个函数，所以就使用`Set`去储存函数。

结构大概可以表示成这样。

```
WeakMap {
  [对象]: Map {
    [属性]: Set[函数]
  }
}
```

清晰了结构之后我们先写`trigger`函数，大概可以是这样。

```js
const targetMap = new WeakMap()

function trigger (target, prop) {
  const depsMap = targetMap.get(target)

  if (!depsMap) { return }

  const deps = depsMap.get(prop) || []
  deps.forEach(fn => fn())
}
```

总而言之就是取到依赖循环调用。

接下来就是`track`函数，但是这里就有个问题了，因为我们现在并不知道`effect`内的函数是什么，拥有的参数也只有对象和对象的属性而已，这可坏事儿了。

所以我们不得不先去写`effect`函数，然后经过仔细思考可以采取以下方案。

> 在`effect`函数执行的时候，把需要调用的函数的引用储存在全局，然后再调用一次，触发其中某个对象属性的`get`，这个时候从全局取到之前储存的函数，把他和对象、对象属性关联到一起之后，再移除这个全局函数的引用。

于是开始实现`effect`

> effect.js

```js
'use strict'

// 全局储存函数的区域
const effectStack = []

function effect (fn) {
  function tmp () {
    // 先在全局储存函数，再执行函数，再移除
    effectStack.push(fn)
    fn()
    effectStack.pop()
  }

  tmp()

  return tmp
}

module.exports = {
  effectStack,
  effect,
}
```

好的，我们同时也暴露了`effectStack`让其他文件也能访问到，接下来去完善我们原本的`track`函数。

```js
const { effectStack } = require('./effect')

function track (target, prop) {
  if (!effectStack.length) {
    return 
  }

  // 取得对象对应的Map，不存在则创建一个
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 取得属性对应的Set，不存在则创建一个
  let deps = depsMap.get(prop)
  if (!deps) {
    deps = new Set()
    depsMap.set(prop, deps)
  }

  // 将全局的函数加入对应依赖中
  deps.add(effectStack[effectStack.length - 1])
}
```

好的，这样一来我们对于某个对象的拦截操作已经全部完成了，接下来就是把这个拦截操作通过`Proxy`设置到真正的对象上，于是来完成`reactive`函数。

```js
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

function reactive (target) {
  if (!isObject(target)) {
    return target
  }

  return new Proxy(target, handler)
}
```

好的，理论上已经完成了，来试验一下看看。

```js
'use strict'

const { effect } = require('./effect')
const { reactive } = require('./reactive')

let dummy
const obj = reactive({ num: 0 })

effect(() => dummy = obj.num)

obj.num = 123
console.log(dummy) // => 123

obj.num++
console.log(dummy) // => 124
```

和我们预测的一样，没什么问题，这样就完成了最简单的实现！

不过需要说明的是，上面的那些只是为了了解原理，使用了最基本最简单的实现，没有进行各种边界判断或者优化，完整的内容还是需要去看`vue3`源代码。

## 一点附加内容

刚刚我们的实现是没有办法嵌套响应对象的，为了能够达到嵌套的效果可以在`get`的时候发现结果是一个对象则再对对象进行`reactive`。

```js
// ...
  get (target, prop) {
    const result = Reflect.get(target, prop)
    track(target, prop)
    return isObject(result) ? reactive(result) : result
  }
```

然后就可以简单的嵌套了。

```js
let dummy
const obj = reactive({ a: { b: 0 } })

effect(() => dummy = obj.a.b)
obj.a.b++
console.log(dummy) // => 1
```

另外`vue3`还提供了一个`ref`接口来转换原始类型的数据，使其能够变为响应式，大概像这样。

```js
const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
```

这个原理和`reactive`类似，把原始数据包装成一个对象，然后设定`value`为`访问器属性（accessor properties）`，假装是对象对于属性的`set`和`get`。

```js
function ref (raw) {
  raw = isObject(raw) ? reactive(raw) : raw

  const wrapper = {
    set value (val) {
      raw = val
      trigger(wrapper, 'value')
    },
    get value () {
      track(wrapper, 'value')
      return raw
    },
  }

  return wrapper
}
```

同样也可以有类似的效果。

```js
let dummy
const count = ref(1)
console.log(count.value) // => 1

effect(() => dummy = count.value)

count.value++
console.log(dummy) // => 2
```

## 总结

说到底我们只是进行了最简单的原理解释，不得不说刚看到测试用例的时候简直惊了，具体的实现细节还是要看源代码啊。

## 参考

- [vue3源代码](https://github.com/vuejs/vue-next/tree/master/packages/reactivity)
- [相关代码](../../code/Vue/reactivity/index.js)
