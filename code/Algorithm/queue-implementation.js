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

const queue = new Queue()

queue.enqueue('foo')
queue.enqueue('bar')
queue.enqueue('baz')
console.log(queue.size) // => 3
console.log(queue.dequeue()) // => 'foo'
console.log(queue.dequeue()) // => 'bar'
console.log(queue.size) // => 1

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