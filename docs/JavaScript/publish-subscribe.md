# publish-subscribe (发布订阅)

## 是什么

> 在软件架构中，发布订阅是一种消息范式，消息的发送者（称为发布者）不会将消息直接发送给特定的接收者（称为订阅者）。而是将发布的消息分为不同的类别，无需了解哪些订阅者（如果有的话）可能存在。同样的，订阅者可以表达对一个或多个类别的兴趣，只接收感兴趣的消息，无需了解哪些发布者（如果有的话）存在。
> (来自 [百度百科](https://baike.baidu.com/item/%E5%8F%91%E5%B8%83%E8%AE%A2%E9%98%85/22695073))

## 为什么

当然是为了降低耦合度，比如我在发一个视频的时候不需要去通知每一个人，只会有一个更新的消息，而订阅到这条消息的人就知道了就可以来看了（并没有），把这个逻辑放到代码里就可以了。

于是，虽然可能是已经烂大街的东西，还是来说一下`发布-订阅`的原理，以及实现一个简单的发布订阅。

## 实现

于是理所当然的，有人订阅发消息才有意义，对于每一个频道，每有一个人订阅，就把那个人放在这个频道里的某个地方。

> 对Set不熟悉的同学可以看[这里](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

```js
class Channel {

  constructor () {
    // 这里使用了不是数组而是Set, 那是因为Set里面的元素不会重复并且可以更方便的对元素进行操作, 所以再也不用担心重复关注了
    this.subscribers = new Set()
  }

  // subscribe - 订阅，subscriber - 订阅者，subscribers - 订阅者们
  // 只要能看得懂英语这个方法就不用解释了
  subscribe (subscriber) {
    this.subscribers.add(subscriber)
  }

}
```

好的，现在一个频道里有了一些不明真相的订阅者，于是当我们发布消息的时候，我们不得不去通知那些订阅者。

```js
  // Channel
  // ...
  publish (msg) {
    this.subscribers.forEach(subscriber => {
      // 我们假设那些订阅者都有一个叫notify的方法
      // 当然更常见的是"订阅者"本身就是一个函数
      subscriber.notify(msg)
    })
  }
```

好了，事实上到这里基本就已经完成了，我们只要再创建一个订阅者对象就好了。

```js
class Subscriber {

  // 姑且给那些不明真相的订阅者一个名字吧
  constructor (username) {
    this.username = username
  }

  // 这就是我们需要的notify方法，当然实际情况的话这里的内容是每个人自己定的
  notify (msg) {
    console.log(`"${this.username}"订阅了一则消息！`)
    console.log(`消息的内容是：${msg}`)
  }

}
```

好了已经全部完成了，开始进行无趣的测试吧。

```js
const sub1 = new Subscriber('小明')
const sub2 = new Subscriber('小红')
const sub3 = new Subscriber('伊丽莎白二世')

const channel = new Channel()
channel.subscribe(sub1)
channel.subscribe(sub2)
channel.subscribe(sub3)
// 即便重复订阅也没有关系！
channel.subscribe(sub3)

channel.publish('倒闭了')
channel.publish('跑了')

// "小明"订阅了一则消息！
// 消息的内容是：倒闭了
// "小红"订阅了一则消息！
// 消息的内容是：倒闭了
// "伊丽莎白二世"订阅了一则消息！
// 消息的内容是：倒闭了
// "小明"订阅了一则消息！
// 消息的内容是：跑了
// "小红"订阅了一则消息！
// 消息的内容是：跑了
// "伊丽莎白二世"订阅了一则消息！
// 消息的内容是：跑了
```

好了，那么如果想要去除某个订阅，自然从订阅者中删除掉那家伙就行了。

```js
  // Channel
  // ...
  remove (subscriber) {
    this.subscribers.delete(subscriber)
  }
```

然后

```js
// ... 
channel.remove(sub1)
channel.remove(sub2)

channel.publish('复活了')

// "伊丽莎白二世"订阅了一则消息！
// 消息的内容是：复活了
```

看来只有伊丽莎白二世能订阅到最后的消息。

## 更多

话说回来，上面那些方法的叫法似乎不太常见，然而只要把

- `subscribe`改成`on`  
- `publish`改成`emit`  
- `remove`改成`off`  

看上去就有点常见了

我想更多的内容可以去参考 Node 中的 [Events](https://nodejs.org/dist/latest-v12.x/docs/api/events.html)

## 参考

- [相关代码](../../code/Javascript/publish-subscribe.js)