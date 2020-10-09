# quick-sort (快速排序)

## 是什么

快速排序的基本思想大概是这样
1. 把数组中的一个数设为基准数。
2. 把所有比他小（或等于）的数放到他左边，把所有比他大的数放到他右边。
3. 再对左右两个数组分别再执行以上规则，直到每个数组只有一个数。

## 实现

事实上想要实现快速排序的方法不止一种，我这里按我认为最容易理解的一种来说。

1. 设定两个指针，分别为数组的起始与结尾。
2. 设定边界条件（即递归结束条件）挡起始大于等于结尾的时候结束。
3. 把最起始指针处所对应的数设置为基准数。
4. 不断的把结尾指针左移，直到结尾指针对应的数小于基准数，交换两者，起始指针+1。
5. 不断的把起始指针右移，直到起始指针对应的数大于基准数，交换两者，结尾指针-1。
6. 不停重复以上两步直到指针重合。
7. 这样最后就形成了比基准数小的都在左边，大的都在右边，然后递归调用即可。

代码实现如下。

```js
function quicksort (arr, left = 0, right = arr.length - 1) {
  // 设置边界条件
  if (left >= right) return 

  // 设置起始指针所在的位置为基准数
  let pivot = arr[left]
  let i = left
  let j = right

  while (i < j) {
    // 结束指针不断向前寻找
    while (i < j && arr[j] > pivot) {
      j--
    }

    if (i < j) {
      swap(arr, i, j)
      i++
    }

    // 起始指针不断向后寻找
    while (i < j && arr[i] < pivot) {
      i++
    }

    if (i < j) {
      swap(arr, i, j)
      j--
    }
  }

  // 递归调用左右两个数组
  quicksort(arr, left, i - 1)
  quicksort(arr, i + 1, right)
}

function swap (arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]]
}
```

然后因为交换这个操作起始可以简化直接给对应指针赋值，最后再把最终的指针赋值给一开始的基准数，就可以省略交换，变成这样。

```js
function quicksort2 (arr, left = 0, right = arr.length - 1) {
  if (left >= right) return 

  let pivot = arr[left]
  let i = left
  let j = right

  while (i < j) {
    while (i < j && arr[j] > pivot) {
      j--
    }

    if (i < j) {
      arr[i] = arr[j]
      i++
    }

    while (i < j && arr[i] < pivot) {
      i++
    }

    if (i < j) {
      arr[j] = arr[i]
      j--
    }

    arr[i] = pivot
  }

  quicksort2(arr, left, i - 1)
  quicksort2(arr, i + 1, right)
}
```

然后可以来测试一下，同时打印一下每次的基准点以及处理的结果。

```js
const arr = [9,1,2,5,7,8,4,6,3,10]
quicksort(arr)
console.log(arr)
```

输出

```
以9为基准:
结果 =>  [ 3, 1, 2, 5, 7, 8, 4, 6, 9, 10 ]
以3为基准:
结果 =>  [ 2, 1, 3, 5, 7, 8, 4, 6, 9, 10 ]
以2为基准:
结果 =>  [ 1, 2, 3, 5, 7, 8, 4, 6, 9, 10 ]
以5为基准:
结果 =>  [ 1, 2, 3, 4, 5, 8, 7, 6, 9, 10 ]
以8为基准:
结果 =>  [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
以6为基准:
结果 =>  [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
```

## 结论

快速排序是目前所有排序里排序速度最快的方法之一，平均的复杂度是`O(nlogn)`，空间复杂度是`O(logn)`，另外是原地排序，非稳定排序。

## 参考

- [快速排序算法详解（原理、实现和时间复杂度）](http://data.biancheng.net/view/117.html)
- [快速排序](https://www.runoob.com/w3cnote/quick-sort.html)
- [十大经典排序算法-快速排序](https://sort.hust.cc/6.quicksort)
- [相关代码](../../code/Algorithm/quick-sort.js)
