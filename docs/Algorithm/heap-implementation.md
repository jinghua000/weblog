# heap-implementation (堆的实现)

## 是什么 

堆是一种可以被看成近似完全二叉树的数据结构，一般可以使用数组来储存。

堆包括最大堆和最小堆：最大堆的每一个节点（除了根结点）的值不大于其父节点；最小堆的每一个节点（除了根结点）的值不小于其父节点。

堆有实际场景中有各种用处，不过这次先来了解一下堆的基本实现。

## 思路整理

作为例子我们这次就实现一个`最大堆`。

堆作为一颗[完全二叉树](https://baike.baidu.com/item/%E5%AE%8C%E5%85%A8%E4%BA%8C%E5%8F%89%E6%A0%91)，父节点和子节点是有对应的关系的，举个例子。

```
       30
     /    \    
   12      20  
  /  \    /
 5    9  7
```

从上到下，从左到右按顺序表示的话就是

```
[30, 12, 20, 5, 9, 7]
 0   1   2   3  4  5
```

由此可以得到下标值之间的对应关系：

- 一个节点的左子节点为 `2i + 1` -> 比如 12，5
- 一个节点的右子节点为 `2i + 2` -> 比如 12，9
- 一个节点的父节点为 `Math.floor((i - 1) / 2)` -> 比如 5，12 / 9，12

好了，接下来就来实现堆的各种方法。

## 代码实现

首先创建一个基本的类。

```js
class MaxHeap {

    constructor(data = []) {
        // 用来记录堆的数据
        this.heap = data
    }

    get data() {
        return this.heap
    }

}
```

### insert (插入)

对于最大堆的插入算法基本可以概括如下。

1. 把新数据push到堆的最后一个。
2. 设定最后一位为当前指针。
3. 如果当前指针大于0则循环
   1. 计算出父节点指针。
   2. 如果父节点指针对应值大于等于当前节点指针对应值，则跳出循环。
   3. 否则交换当前指针与父节点指针对应的值。
   4. 将当前指针指向父节点指针。

用比较人性化的表述就是，我一开始是最后一个，如果我的父节点没我大我就和他交换，直到我是最大的，或者我的父节点比我大。用图来表示一下。

> 插入40

```
       30
     /    \ 
   12      20 
  /  \    /  \
 5    9  7   (40)
```

> 40和20交换

```
       30
     /    \ 
   12     (40) 
  /  \    /  \
 5    9  7   20
```

> 40和30交换

```
      (40)
     /    \ 
   12      30 
  /  \    /  \
 5    9  7   20
```

代码如下。

```js
// ...

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
```

这样一来可以保证在插入数据之后，仍然能够保证最大堆的特性。根据算法每次要除以2得到父节点可知，这个算法的时间复杂度和二分法一样，是`O(logn)`，空间复杂度是`O(1)`。

验证一下。

```js
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
```

没有问题，那么来进行后面的实现。

### remove (取出)

总而言之这个方法就是取出最大堆的最大值，也就是说取出堆的根节点。

算法描述大致如下。

1. 如果只有一个或没有节点，则删除并返回这个节点，结束。
2. 取出根节点并储存，再删除最后一个节点，并设置到根节点。
3. 设定当前指针指向空，设定next指针指向0。
4. 如果当前指针不等于下一个指针则循环。
   1. 将当前指针指向next指针。
   2. 计算出左子节点，右子节点。
   3. 如果左子节点存在并大于next节点，将next指针指向左子节点。
   4. 如果右子节点存在并大于next节点，将next指针指向右子节点。
   5. 交换当前位置与next指针。

用比较人性化的话说就是，每次看自己和两个子节点哪个最大，把自己和最大的那个交换，如此往复，直到自己是最大的那一个。

用图来表示大概是这样。

> 原始堆

```
       40
     /    \ 
   12      30 
  /  \    /  \
 5    9  7   20
```

> 把最后一位设置到根节点。

```
      (20)
     /    \ 
   12      30 
  /  \    /  
 5    9  7   
```

> 交换20和30

```
       30
     /    \ 
   12      (20) 
  /  \    /  
 5    9  7   
```

> 结束

```
       30
     /    \ 
   12      20 
  /  \    /  
 5    9  7   
```

```js
// ...

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
```

这样之后即便取出了根节点，还是能保证剩下的堆是最大堆。这个算法的时间复杂度也是`O(logn)`，空间复杂度`O(1)`。

测试一下。

```js
console.log(heap.remove()) // => 40
console.log(heap.data)
// => [ 30, 12, 20, 5, 9, 7 ]

console.log(heap.remove()) // => 30
console.log(heap.data)
// => [ 20, 12, 7, 5, 9 ]

console.log(heap.remove()) // => 20
console.log(heap.data)
// => [ 12, 9, 7, 5 ]
```

## 总结

这次介绍了堆的基本概念，了解他是使用堆的基础！

一般来说插入和删除之后调整堆的操作起的名字都会含有一个`heapify`单词，比如插入`heapify-up`，删除`heapify-down`。如果只有一种操作也可能会直接定义一个叫`heapify`的函数。

另外删除操作看到的很多都是使用递归实现的，不过我个人觉得用迭代更容易理解，还能稍微降低空间复杂度。
## 参考

- [leetcode Heap](https://leetcode-cn.com/tag/heap/)  
- [javascript-heap-datastructure](https://reactgo.com/javascript-heap-datastructure/)
- [相关代码](../../code/Algorithm/heap-implementation.js)