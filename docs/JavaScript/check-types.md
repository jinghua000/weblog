# check-types (检查类型)

## 是什么

今天来整理一下JS中判断数据类型的一些方案吧。

## 方案

### 方案1：typeof

这个可谓是最基本的判断类型的方法，具体的判断列表可以参考[底部链接](#参考)，以下列举几个比较特殊的点。

```js
typeof null // => object
typeof function () {} // => function
```

一个是对`null`使用会返回`object`，这个应该算是JS的历史遗留问题了。另外对函数使用会返回`function`，虽然函数并不是JS中的数据类型但是从实现上还是和别人分开了。

> 结论
> 1. 可以判断除了null以外的基本类型。
> 2. 对函数会进行特殊处理。
> 3. 除了以上都会返回`object`。

### 方案2：instanceof

`instanceof`操作符直接的意义是——检查操作符右边的构造函数的`prototype`属性是否在操作符左边的对象的原型链上。

按照最基本的含义就是。

```js
let a = {}
let b = function () {}
a.__proto__ = b.prototype
a instanceof b // => true
```

简单用代码来大概实现一下大概是这样。

```js
function isInstanceOf (A, B) {
  return Object.prototype.isPrototypeOf.call(B.prototype, A)
}
```

当然没有做边界判断，不过根据这个描述最基本的实现就是这样了。不过需要注意的是`instanceof`是会判断所有原型链的，所以也会出现这种情况。

```js
[] instanceof Array // => true
[] instanceof Object // => true
```

另外对非对象判断也是不成立的。

```js
'' instanceof String // => false
1 instanceof Number // => false
```

所以总结一下这个方法的使用场景。

> 结论
> 1. 不适合判断具体类型，适合判断对象的原型链是否符合条件。
> 2. 不能对非对象使用。

### 方案3：constructor

`constructor`事实上只是一个单纯的属性，不过可以根据JS的特性借助他判断类型。

`constructor`的意义则是构造函数，如果对一个对象使用的话，则就相当于直接去取得这个属性，比如。

```js
[].constructor === Array // => true
new Date().constructor === Date // => true
```

并且因为`constructor`指向唯一，所以可以准确的判断出对象的构造函数到底是谁，可以用来分辨数组之类的。

```js
[].constructor === Object // => false
```

而对于基本类型使用的话，因为JS的特性，会用基本类型对应构造函数生成一个实例，再去对实例进行操作，所以也可以用在基本属性上。

```js
(1).constructor === Number // => true
''.constructor === String // => true
```

不过对于`null`或者`undefined`使用就会报错了要注意。

```js
null.constructor // => ERROR!
```

另外需要注意的是`constructor`属性是可以被修改的，比如下面这个例子。

```js
function A () {}
function B () {}
A.prototype.constructor = B

let a = new A()
a instanceof A // => true
a instanceof B // => false
a.constructor === A // => false
a.constructor === B // => true
```

惊了个呆，真的这样写会让人非常沮丧，总而言之知道这一点就好了。

> 结论
> 1. 可以准确判断除了`null`和`undefined`以外的某个值的构造函数。
> 2. `constructor`属性可能被修改。

### 方案4：Object.prototype.toString

调用某个值的`toString`方法，因为本身很可能复写了`toString`方法，所以一般`Object.prototype.toString.call(xxx)`这样用。

```js
Object.prototype.toString.call([]) // => "[object Array]"
Object.prototype.toString.call(1) // => "[object Number]"
Object.prototype.toString.call(null) // => "[object Null]"
Object.prototype.toString.call(new Date()) // => "[object Date]"
```

可以对所有值使用，非常的方便，并且可以明确的区分出具体的类型。

另外需要注意的一点是如果某个对象拥有`Symbol.toStringTag`属性，那么`Object.prototype.toString`会优先获取到这个属性，比如

```js
let foo = {}
foo[Symbol.toStringTag] = 'Foo'
Object.prototype.toString.call(foo) // => "[object Foo]"
```

> 结论
> 1. 十分通用的判断类型的方法。
> 2. 如果有`Symbol.toStringTag`属性则会优先获得。

## 总结

如果是需要完整的判断我个人还是喜欢用`Object.prototype.toString`，其他的话在一些特定的地方随意就好。

## 参考

- [typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
- [instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
- [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor)
- [toString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)
- https://javascript.info/instanceof