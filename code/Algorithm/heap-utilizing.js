// const arr = [2,5,9,7,8,1]
const arr = [9,1,2,5,7,8,4,6,3,10]
console.log(heapsort(arr))

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