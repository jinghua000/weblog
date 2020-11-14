class MaxHeap {

    constructor(data = []) {
        // 用来记录堆的数据
        this.heap = data
    }

    get data() {
        return this.heap
    }

    insert(val) {
        this.heap.push(val)

        let index = this.heap.length - 1
        while (index > 0) {
            // 相当于Math.floor((index - 1) / 2)
            let parentIndex = (index - 1) >> 1
            let current = this.heap[index]
            let parent = this.heap[parentIndex]

            if (parent >= current) break
            this.heap[parentIndex] = current
            this.heap[index] = parent
            index = parentIndex
        }
    }

    remove() {
        const last = this.heap.pop()
        const length = this.heap.length
        if (!length) return last

        const result = this.heap[0]
        this.heap[0] = last

        let index = null
        let next = 0

        while (index !== next) {
            index = next

            // 取得左右子节点
            let left = (index << 1) + 1
            let right = (index << 1) + 2

            if (left < length && this.heap[left] > this.heap[next]) {
                next = left
            }

            if (right < length && this.heap[right] > this.heap[next]) {
                next = right
            }

            // 交换
            ;[this.heap[index], this.heap[next]] = [this.heap[next], this.heap[index]]
        }

        return result
    }
}

const heap = new MaxHeap()

heap.insert(12)
heap.insert(5)
heap.insert(7)
heap.insert(9)
heap.insert(20)
heap.insert(30)

console.log(heap.data)
// => [ 30, 12, 20, 5, 9, 7 ]

heap.insert(40)
console.log(heap.data)
// => [ 40, 12, 30, 5, 9, 7, 20]

console.log(heap.remove()) // => 40
console.log(heap.data)
// => [ 30, 12, 20, 5, 9, 7 ]

console.log(heap.remove()) // => 30
console.log(heap.data)
// => [ 20, 12, 7, 5, 9 ]

console.log(heap.remove()) // => 20
console.log(heap.data)
// => [ 12, 9, 7, 5 ]

heap.remove()
heap.remove()
heap.remove()
console.log(heap.data)
// => [ 5 ]

console.log(heap.remove()) // => 5
console.log(heap.data)
// => []

console.log(heap.remove()) // => undefined
console.log(heap.data)
// => []