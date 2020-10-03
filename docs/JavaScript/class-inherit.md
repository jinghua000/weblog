# class-inherit (类继承的简易实现)

## 是什么

类虽然只算是一种称呼不是JS的实际类型不过还是经常会遇到，来稍微在JS中实现一下这一情况好了。

## 实现

### 基于class

如果是基于[`class`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/class)关键字则比较方便了，因为本身就是为了让`类`这一概念更为明确而设定的。

首先创建一个父类`Animal`。

```js
class Animal {

  constructor (name) {
    this.name = name
  }

} 
```

然后再创建一个子类`Rabbit`继承他，可以使用`extends`关键字。

```js
class Rabbit extends Animal {

  constructor (...args) {
    super(...args)
    this.isRabbit = true
  }

}
```

这样一来基本就已经完成了，来稍微测试一下。

```js
let rabbit = new Rabbit('foo') 
console.log(rabbit) // => Rabbit { name: 'foo', isRabbit: true }
console.log(rabbit.__proto__ === Rabbit.prototype) // true
console.log(rabbit.__proto__.__proto__ === Animal.prototype) // true
```

子类调用了父类的构造函数，拥有父类以及自己的属性，然后子类的`prototype`属性的原型指向父类的`prototype`属性，看上去已经完美的实现了JS中的继承。

### 基于function

在`class`语法之前，类都是使用`function`来表示的，那么来基于`function`来实现一下类的继承吧。

```js
function Animal (name) {
  this.name = name
}
```

根据JS中类的继承特性，主要就是两点：
1. 调用父类的构造函数
2. 将`prototype`属性的原型指向父类的`prototype`属性

那么按照这两点依次实现就好。

```js
function Rabbit (...args) {
  Animal.call(this, ...args) // => 注意这里要改变一下上下文指向
  this.isRabbit = true
}

Rabbit.prototype = Object.create(Animal.prototype)
```

这样一来也就实现了继承，如果把继承这一操作提取到函数外的话大概可以写成这样。

```js
function extend (parent, child) {
  const result = function (...args) {
    parent.call(this, ...args)
    child.call(this, ...args)
  }

  result.prototype = Object.create(parent.prototype)
  return result
}

const Rabbit = extend(Animal, function (...args) {
  this.isRabbit = true
})
```

原理都是一样，在写法上注意一下就好。

然后来测试一下（测试内容和上面一样）也没有问题，那么也用`function`实现了类的继承，针不戳。

## 总结

也是JS的基础知识，了解他们的原理是好事。

## 参考

- [Inheritance in JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance)
- [相关代码](../../code/Javascript/class-inherit.js)