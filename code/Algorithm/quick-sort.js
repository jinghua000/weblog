function quicksort (arr, left = 0, right = arr.length - 1) {
  // 设置边界条件
  if (left >= right) return 

  // 设置起始指针所在的位置为基准数
  let pivot = arr[left]
  let i = left
  let j = right

  console.log(`以${pivot}为基准:`)

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

  console.log(`结果 => `, arr)

  // 递归调用左右两个数组
  quicksort(arr, left, i - 1)
  quicksort(arr, i + 1, right)
}

function swap (arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]]
}

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

const arr = [9,1,2,5,7,8,4,6,3,10]
// const arr = [1,1,1,1,1,1,1,1,1,1]
quicksort(arr)
// quicksort2(arr)
console.log(arr)