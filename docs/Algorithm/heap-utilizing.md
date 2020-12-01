# heap-utilizing (堆的运用)

## 前言

之前我们学习了[堆的基本实现](./heap-implementation.md)，这次来了解一下他的实际运用。

## 排序

首先对于堆来说的一个十分通常的运用就是排序了，接下来尝试实现一个**由小到大**的堆排序吧。

对于从小到大的排序，大致的思路是：

1. 把原本的数组转换成一个`大顶堆`。
2. 把第一位和最后一位交换，此时最后一位就是最大值。
3. 把整体堆的长度减一，然后再构建成新的大顶堆。
4. 重复以上2步（类似于`remove`操作），最后得到一个从小到大排序的数组。

首先假设有一个这样的数组。

```
[2,5,9,7,8,1]
```

把他转为二叉树的形式则是。

```
      2
    /   \ 
   5     9
 /  \   /
7    8 1
```

接下来的问题就是，如何把现有的数组变成一个大顶堆。

虽然也可以从最后一个元素开始遍历一个个执行插入运算，但还有更简单的方法。首先回顾一下大顶堆的特性，**任意一个父节点大于等于其子节点**，所以对于堆来说最快的计算方式是从最后一个**非叶子节点**开始遍历，以此位置开始往下生成堆，这样就可以不用运算剩余的叶子节点了。

于是要想如何取得最后一个非叶子节点。

在之前的[堆的实现](./heap-implementation.md)中我们知道，取得一个节点的父节点为`Math.floor((i - 1) / 2)`，那么只要把最后一个节点带入这个公式即可。

比如对于数组

```
[2,5,9,7,8,1]
```

最后一个节点下标是5，则最后一个非叶子节点下标则为`Math.floor((5 - 1) / 2)`为2。

那么先来实现一个函数，把数组转换成大顶堆。

```js
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

```

这里之所以实现一个`heapify`函数是为了之后排序用。

下面是由数组变化到最大堆的过程：

> 原始数组：

```
      2
    /   \ 
   5     9
 /  \   /
7    8 1
```

> 从9开始遍历，不用动，再遍历到5，交换8和5。

```
      2
    /   \ 
  (8)     9
 /  \   /
7   (5)1
```

> 遍历到2，交换2和9，最终变成。

```
     (9)
    /   \ 
   8     (2)
 /  \   /
7    5 1
```

然后之后获得了最大堆，之后执行我们之前整理出思路的第2到4步。一个个把最大的元素放到数组末尾最后再把之前的数组整理成最大堆。

```js
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
```

每次都让堆得大小减一，这样每次都能得到一个最大的元素。

来测试一下。

```js
console.log(heapsort([9,8,6,7,5,4,3,1,2,10]))
// => [1,2,3,4,5,6,7,8,9,10]
```

堆排序是原地排序，不稳定排序。空间复杂度为`O(1)`，时间复杂度为`O(nlogn)`。时间复杂度可以解释为对每一个元素进行了`heapify`，故复杂度为`n * logn`。

## topK

而堆的另外一个非常常用的用法就是`优先队列`，给普通队列的元素中再带上了优先级。比较通俗的语言可以解释为从最先满足某些条件的元素开始删除。

topK可以解释为：

**取得数组中最大的第k个元素**

比如：

```
input: nums = [3,2,1,5,6,4], k = 2

output: 5
```

因为5是整个数组中第二大的元素。

### 整理思路

最直观的思路排序之后再取第二个就好了，这样的复杂度是`O(nlogn)`。

但这里因为我们需要的仅仅是第二个大的数字，所以其实没有必要完全的排序，只要创建一个长度为2的最小堆。最小的全部被去除之后，只剩倒数第二小的，也就是第二大的数字了。

这样的算法理论上就是`O(nlogk)`，解释为每次需要对一个长度为k的堆做插入和删除操作，然后对所有元素执行这个操作复杂度为`n * logk`，优于整体排序。

### 实现

整体代码结构大概是这样。

```js
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

// ...
```

然后后面就实现`push`和`remove`这两个方法，就是入堆和出堆。

```js
// ...

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
```

这两个操作之前已经讲过很多了就不重复说明了，总而言之这样就成功的用比较好的方法处理了topK问题。

> 当然这道题也可以用快速排序做，不过这次主要讲堆。

题目的[地址](https://leetcode-cn.com/problems/kth-largest-element-in-an-array/)。

## 总结

堆总体算是一种比较复杂的数据结构，不过在优先队列中的运用可以有效的减少一些不必要消耗，看情况好好使用吧。
## 参考

- [topK](https://leetcode-cn.com/problems/kth-largest-element-in-an-array/)
- [leetcode Heap](https://leetcode-cn.com/tag/heap/)  
- [堆排序](https://sort.hust.cc/7.heapsort)
- [heap sort](https://www.programiz.com/dsa/heap-sort#:~:text=%20How%20Heap%20Sort%20Works%3F%20%201%20Since,have%20the%20highest%20element%20at%20root.%20More%20)
- [相关代码](../../code/Algorithm/heap-utilizing.js)