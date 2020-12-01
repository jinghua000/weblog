function buildMaxHeap(arr) {
    const length = arr.length
    let cursor = (length - 1) / 2 >> 0

    while (cursor >= 0) {
        heapify(arr, length, cursor)
        cursor--
    }

    return arr
}

/**
 * 从i处开始生成最大堆
 * 
 * @param {number[]} arr - 堆的数组
 * @param {number} length - 堆的大小
 * @param {number} i - 开始位置
 */
function heapify(arr, length, i) {
    if (length < 2) return 

    let index = null
    let next = i

    while (index !== next) {
        index = next

        let left = (index << 1) + 1
        let right = (index << 1) + 2

        if (left < length && arr[left] > arr[next]) {
            next = left
        }

        if (right < length && arr[right] > arr[next]) {
            next = right
        }

        swap(arr, index, next)
    }
}

function swap(arr, index1, index2) {
    [arr[index1], arr[index2]] = [arr[index2], arr[index1]]
}

function heapsort(arr) {
    buildMaxHeap(arr)

    let cursor = arr.length - 1
    while (cursor >= 0) {
        swap(arr, 0, cursor)
        heapify(arr, cursor, 0)
        cursor--
    }

    return arr
}

console.log(heapsort([9,8,6,7,5,4,3,1,2,10]))


/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findKthLargest = function(nums, k) {
    const heap = []

    for (let i = 0; i < nums.length; i++) {
        // 构建最小堆
        push(nums[i])

        // 如果堆的长度大于k，则删除第一个
        if (heap.length > k) {
            remove()
        }
    }

    // 返回最小堆的第一个，即为倒数第k个最小数，即为第k个最大数
    return heap[0]

    function push(val) {
        heap.push(val)

        let index = heap.length - 1
        while (index) {
            let parentIndex = (index - 1) >> 1
            let parent = heap[parentIndex]
            let current = heap[index]

            if (parent <= current) break
            heap[parentIndex] = current
            heap[index] = parent
            index = parentIndex
        }
    }

    function remove() {
        heap[0] = heap.pop()

        let index = null
        let next = 0
        let length = heap.length
        while (index !== next) {
            index = next

            let left = (index << 1) + 1
            let right = (index << 1) + 2

            if (left < length && heap[left] < heap[next]) {
                next = left
            }
            
            if (right < length && heap[right] < heap[next]) {
                next = right
            }

            ;[heap[index], heap[next]] = [heap[next], heap[index]]
        }
    }
};

console.log(
    findKthLargest([4,3,1,5,6], 3)
) // => 4