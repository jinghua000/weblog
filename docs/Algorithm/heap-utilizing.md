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

然后之后获得了最大堆，之后执行我们之前整理出思路的第2到4步。一个个把最大的元素放到数组末尾最后再



## 参考

- [堆排序](https://sort.hust.cc/7.heapsort)
- [heap sort](https://www.programiz.com/dsa/heap-sort#:~:text=%20How%20Heap%20Sort%20Works%3F%20%201%20Since,have%20the%20highest%20element%20at%20root.%20More%20)