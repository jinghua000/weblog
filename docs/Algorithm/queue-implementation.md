# queue-implementation (队列的实现)

## 是什么

队列（Queue）是一种先进先出（FIFO，First-In-First-Out）的线性表。

说起来队列也是一种比较简单的数据结构，这次主要探讨一下JavaScript实现队列的方法。

## 思路

因为js本身没有原生的队列，所以经常使用`数组`进行代替。

- 入队 - enqueue - 可用数组原生的push方法
- 出队 - dequeue - 可用数组原生的shift方法

比如

```js
const arr = []
arr.push('foo')
arr.push('bar')
arr.shift() // => foo
```

虽然简单，然而这种实现方式毫无疑问是不太好的。入队还好说，但对于出队，数组剔除第一个元素会有O(n)的复杂度。具体原因是当移除了第一个元素之后，数组不得不把后续的所有元素往前移动一位。

而对于队列来说入队和出队不需要关心除了头尾以外的元素，所以理论上复杂度应该是O(1)。

所以可以使用**链表**来更好的实现队列。

## 实现

```js
// 链表节点
class Node {

    constructor(value) {
        this.value = value
        this.next = undefined
    }

}

class Queue {

    constructor() {
        this.head = undefined
        this.tail = undefined
        this.size = 0
    }

    // 入队
    enqueue(value) {
        // 如果队列不为空，则将节点增加到尾结点的next节点再更新尾结点
        if (this.head) {
            this.tail.next = new Node(value)
            this.tail = this.tail.next
        // 如果队列为空，则将首节点与尾结点设为新节点
        } else {
            this.head = new Node(value)
            this.tail = this.head
        }

        this.size++
    }

    // 出队
    dequeue() {
        if (!this.head) {
            return 
        }

        // 如果首节点存在，则删除首节点并返回
        const result = this.head.value

        this.head = this.head.next
        this.size--

        return result
    }

}
```

测试一下

```js
queue.enqueue('foo')
queue.enqueue('bar')
queue.enqueue('baz')
console.log(queue.size) // => 3
console.log(queue.dequeue()) // => 'foo'
console.log(queue.dequeue()) // => 'bar'
console.log(queue.size) // => 1
```

看上去没什么问题这样就完成了。

## 性能

这样一来从理论上就完成了入队与出队的O(1)算法，那么这个和原生的把数组当做队列的性能比起来如何呢，来稍微尝试一下。

编写3个测试函数

```js
function test(add, remove) {
    const start = process.hrtime.bigint()
    const times = 10e4
    for (let i = 0; i < times; i++) {
        add(i)
    }
    for (let i = 0; i < times; i++) {
        remove()
    }
    const end = process.hrtime.bigint()
    const result = (end - start) / 1000n / 1000n
    console.log(`cost ${result} ms`)
}


function testarray() {
    const queue = []
    console.log(`array costs:`)
    test(function(value) {
        queue.push(value)
    }, function () {
        queue.shift()
    })
}


function testqueue() {
    const queue = new Queue()
    console.log(`queue costs:`)
    test(function(value) {
        queue.enqueue(value)
    }, function () {
        queue.dequeue()
    })
}

testarray()
testqueue()
```

我们模拟了一个10万大小的队列的入队与出队，打印其花费的时间。

结果为：

```
array costs:
cost 11015 ms
queue costs:
cost 19 ms
```

由此可见，不同复杂度的算法在大数据量的情况下差异巨大。

## 总结

队列是十分基础的数据结构，这次了解了一些他的基本实现方式。

## 参考

- [yocto-queue](https://github.com/sindresorhus/yocto-queue)
- [相关代码](../../code/Algorithm/queue-implementation.js)