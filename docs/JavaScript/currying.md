# currying (函数的柯里化)

## 是什么

> 在计算机科学中，柯里化（Currying）是把接受多个参数的函数变换成接受一个单一参数(最初函数的第一个参数)的函数，并且返回接受余下的参数且返回结果的新函数的技术。
> (来自 [百度百科](https://baike.baidu.com/item/%E6%9F%AF%E9%87%8C%E5%8C%96))

## 为什么

于是就举一个简单的例子  

比如现在有一个数组`[1, 2, 3]`, 现在需要把其中的每一项都 **加上1**  

代码实现如下：

```js
[1, 2, 3].map(num => num + 1)
```

聪明的选手优化了代码之后

```js
const add1 = num => num + 1

[1, 2, 3].map(add1) // => 可读性变强了!
```

然后现在需要，每一项都 **加上2**  

聪明的选手复制了代码

```js
const add2 = num => num + 2

[1, 2, 3].map(add2) // => 只要复制就完成了！
```

但是这远远没有结束，还需要，每一项都 **加上3**

聪明的选手还在复制代码，更聪明的选手已经学会了封装。

```js
const add = x => num => num + x

[1, 2, 3].map(add(3)) // => 不愧是更聪明的选手！
```

上述的这个`add`函数，大致就是之前自己写的[shadow-fns](https://github.com/jinghua000/shadow-fns/blob/master/doc/README.md#add)这个函数库中`add`函数的实现思路。

## 更多

现在我们拥有了一个看上去比较灵活的`add`，但贪婪的我们希望他也能像正常的函数一样调用。

```js
add(1, 1) // => 正常调用！
add(1)(1) // => 柯里化调用！
```

于是打算封装一个`curry`函数，让他能把普通的函数变得柯里化。

### 实现思路整理

1. 传入一个函数
2. 把所有提供的参数的数量与传入函数需要的参数数量做对比
   1. 如果数量足够，则调用原本函数
   2. 如果数量不够，返回一个新函数，带上之前传的参数
3. 返回柯里化后的函数

```js
// 传入了一个函数
const curry = fn => {
  // 定义一个柯里化后的函数
  const curried = (...args) => 
    // 判断参数数量
    args.length < fn.length
      // 不够就带上参数递归地返回这个函数
      ? (...args2) => curried(...args, ...args2)
      // 够了就调用原函数
      : fn(...args)
  // 返回柯里化后的函数
  return curried
}
```

我们完成了！让我们来试验一下。

```js
const add = (a, b) => a + b
const newAdd = curry(add)

newAdd(1, 2) // => 3
newAdd(1)(2) // => 3 - 他做到了！
```

我们完成了一个看上去十分通用的柯里化函数，孩子很喜欢，家长很放心。

但是事实上并不是这样！

## 注意点

### This的指向

首先，如果你像上面描述的那样实现柯里化函数，`this`的指向会丢失。

例如，如果你的原函数是这样：

```js
function foo (a, b) {
  this.a = a
  this.b = b
}
```

如果想要柯里化他

```js
const newFoo = curry(foo)

newFoo(1)(2) // => 这会出问题！
```

虽然我们也可以在`curry`函数内部进行`apply`，`call`之类的方法去重定向`this`

但是更推荐的在那之前首先`bind`对应的环境。

```js
const obj = {}
const newFoo = curry(foo.bind(obj)) // => 对于有上下文的函数，这样是最安全的！

newFoo(1)(2)

console.log(obj.a) // => 1
console.log(obj.b) // => 2
```

关于`bind`的用法可以参考[这里](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。

### 默认参数和Rest参数

十分明显的，我们是通过函数的`length`属性去取得函数需要的参数，然而，这在拥有默认参数和Rest参数的时候并不适用。

```js
function fn1 (a, b = 1, c = 2) {}

console.log(fn1.length) // => 1 - 我的天！

function fn2 (...args) {}

console.log(fn2.length) // => 0 - 这实在是！
```

如果对上述函数柯里化不会按照预期工作，不过针对这种情况我们可以用另外一个函数[`curryN`](https://github.com/jinghua000/shadow-fns/blob/master/doc/README.md#curryN)去得到类似的效果。

事实上就是把`length`属性换成了一个自己定义的变量。

### 参数的数量以及性能

诚如你所见，柯里化函数（按照以上的实现方式），通过参数的数量判断原函数是否调用，所以他必须要拥有足够的参数才会执行。

还是上面的那个例子

```js
const add = (a, b) => a + b
const newAdd = curry(add)

newAdd(1)() // => 这是不会工作的，会返回一个函数！
newAdd(1)()()()(2) // => 这样是会工作的。
```

其他的，也是因为通过参数数量判断返回值，所以通过柯里化调用非常明显的会多返回一个函数，所以必然的会有多余的性能消耗。

```js
add(1, 2)
add(1)(2) // => 这种会有更多的消耗！
```

当然这是微乎其微的，不过在实际使用的时候一般会定义好柯里化后的函数，供之后调用。

```js
const add1 = add(1)

// ...
// 在其他地方使用这个函数
```

## 总结

总而言之currying是一种让函数更为灵活的编程方式，不过在使用的时候也有诸多注意点，让我们和柯里化和睦相处吧。

事实上两个十分流行的js库里都提供了类似的方法，并且他们的功能更为强大！

- [lodash](https://lodash.com/docs/4.17.15#curry)
- [ramda](https://ramdajs.com/docs/#curry)

## 参考

- [shadow-fns](https://github.com/jinghua000/shadow-fns/blob/master/doc/README.md#curry)
- [相关代码](../../code/Javascript/currying.js)