# dynamic-programming-ext (动态规划-附加)

这里是对之前[动态规划](./dynamic-programming.md)的一些补充。

## 题目1

**题目**

**在一个由 0 和 1 组成的二维矩阵内，找到只包含 1 的最大正方形，并返回其面积。**

比如

```
输入: 

1 0 1 0 0
1 0 1 1 1
1 1 1 1 1
1 0 0 1 0

输出: 4
```

> 输入的实际内容为 `[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]`

**思考**

这个题目最直观的做法是依次循环每一个元素，假设从左上开始遍历，如果找到`1`则再从那个点向下向右找每次新找一行，看是不是那一行的所有元素都为`1`，最后记录下最长的边长，边长乘以边长就是正方形的面积了。

不过这样复杂度比较高，所以我们来考虑有没有复杂度更低的算法。

假设我们从左上开始遍历，那么遍历完成到最后就是右下，那么我们考虑把右下的点作为正方形的右下角看他们之间是否有关联。

当一个点表示`以这点为右下角的正方形`时，这一点的正方形的面积，有以下两种情况。

1. 如果是0则面积为0
2. 如果不是0，则面积为`上方的点对应的正方形`，`左方的点对应的正方形`，`左上方的点对应的正方形`，这3者中最小的一个正方形的边长+1的边长的正方形的面积。

如果能考虑到第二种情况的话，那么我们就可以以`某个点为正方形右下角的边长`进行动态规划

```
dp(x, y) = min(dp(x - 1, y), dp(x, y - 1), dp(x - 1, y - 1)) + 1
```

且当`x`或者`y`为0的时候，`dp(x, y)`的最大值为`1`。

如果我们按照刚刚的思路对于最上面的例子，得到的结果是这样的

```

1 0 1 0 0
1 0 1 1 1
1 1 1 2 2
1 0 0 1 0

```

可见最大的正方形边长是`2`，那么最大的正方形面积就是`4`。

代码实现如下：

```js
/**
 * @param {character[][]} matrix
 * @return {number}
 */
var maximalSquare = function(matrix) {
  if (!matrix.length) return 0

  // 创建一个和原本一模一样大小的二维数组
  const dp = Array(matrix.length).fill(0).map(
    () => Array(matrix[0].length).fill(0)
  )

  let max = 0
  for (let x = 0; x < matrix.length; x++) {
    for (let y = 0; y < matrix[x].length; y++) {
      // 如果对应元素为0则跳过
      if (!+matrix[x][y]) continue

      // 如果是最上或者最左边的元素则边长为1，否则带入状态转移方程
      if (x === 0 || y === 0) {
        dp[x][y] = 1
      } else {
        dp[x][y] = Math.min(dp[x - 1][y], dp[x][y - 1], dp[x - 1][y - 1]) + 1
      }

      max = Math.max(dp[x][y], max)
    }
  }

  return max * max
};
```

这样之后我们就通过动态规划的方式实现了时间复杂度`O(mn)`（遍历了每一个元素）空间复杂度`O(mn)`（创建了一个`mn`大小的二维数组）的算法。

然后我们注意到，每次对一个元素进行计算时，只关系到其`左`，`上`，`左上`的第一个元素，意思就是说只关系到当前这一行数据以及上一行数据，所以我们不需要创建一个`mn`大小的数组，只需要创建两个长度为`n`的数组就可以了。

空间优化的代码如下：

```js
/**
 * @param {character[][]} matrix
 * @return {number}
 */
var maximalSquare = function(matrix) {
  if (!matrix.length) return 0

  // 只创建第一行的动态规划数组
  const dp = Array(matrix[0].length).fill(0)
  let max = 0

  for (let x = 0; x < matrix.length; x++) {
    // 每次遍历下一行之前先复制上一行数组
    let tmp = [].concat(dp)
    for (let y = 0; y < matrix[x].length; y++) {
      if (+matrix[x][y]) {

        if (x === 0 || y === 0) {
          dp[y] = 1
        } else {
          dp[y] = Math.min(dp[y - 1], tmp[y - 1], tmp[y]) + 1
        }
        
      } else {
        dp[y] = 0
      }

      max = Math.max(dp[y], max)
    }
  }

  return max * max
};
```

这样一来空间复杂度就优化成了`O(n)`，当然还有一种方式是可以修改原本数组达到空间复杂度`O(1)`，不过那样会对原始数据进行修改我们这里就不这样做了。

最后我们以时间复杂度`O(mn)`，空间复杂度`O(n)`完成了这道题目。

## 参考

- [题目1](https://leetcode-cn.com/problems/maximal-square/)
