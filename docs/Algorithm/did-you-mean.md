# did-you-mean (Did you mean?)

这次来尝试实现一下`did you mean`效果。

具体来说就是比如我们使用一些cli工具的时候，如果打错了几个字，则会提示你要输入的是不是别的什么东西。

比如使用vue-cli打一个命令`vue create`的时候故意打错`vue creat`，就会有类似的提示。

```
Unknown command creat.

Did you mean create?
```

一般这种效果会使用[编辑距离](https://baike.baidu.com/item/%E7%BC%96%E8%BE%91%E8%B7%9D%E7%A6%BB)去计算，当编辑距离小于一定数量时，则认为相差不大。

最常见的定义是每次可以插入，删除，或替换一个字符，计算整个操作的次数。

那么就需要一个，计算两个字符串相差字符个数的算法。

变成算法题了有没有，刚好LeetCode上也有一道类似的[题目](https://leetcode-cn.com/problems/edit-distance/)。

## 编辑距离

给你两个单词 word1 和 word2，请你计算出将 word1 转换成 word2 所使用的最少操作数 。

你可以对一个单词进行如下三种操作：

插入一个字符
删除一个字符
替换一个字符
 

**示例 1：**

```
输入：word1 = "horse", word2 = "ros"
输出：3
解释：
horse -> rorse (将 'h' 替换为 'r')
rorse -> rose (删除 'r')
rose -> ros (删除 'e')
```

**示例 2：**

```
输入：word1 = "intention", word2 = "execution"
输出：5
解释：
intention -> inention (删除 't')
inention -> enention (将 'i' 替换为 'e')
enention -> exention (将 'n' 替换为 'x')
exention -> exection (将 'n' 替换为 'c')
exection -> execution (插入 'u')
```

### 思路

先来整理一下，一共有3种操作情况：

- 情况1：word1添加一个字符
- 情况2：word1减少一个字符
- 情况3：word1替换一个字符

然后稍微思考一下就可以发现，第二条的操作可以转换成另一个字符串的加法运算。

- 情况2：~~word1减少一个字符串~~ -> word2添加一个字符

这两个操作的次数一定是一样的。

然后这个问题看上去无从下手，这个时候就可以考虑能不能找到每次的状态间的关联，然后我们可以通过分别计算3种可能性得出以下3点规律。

为了方便理解这里拿出具体的例子好了，就如同题目的例子

1. 假设`horse`转换到`ro`需要`a`步，然后只考虑情况1，则`horse`，转换到`ros`最多需要`a+1`步。原因是可以通过`a`步先把`horse`转换成`ro`，再通过一步加上一个`s`。
2. 反之亦然，只考虑情况2，假设`ros`转换到`hors`需要`b`步，则`ros`转换到`horse`最多需要`b+1`步。
3. 接下来，假设`horse`转换到`ro`需要`c`步，只考虑情况3，则`horse`，转换到`ros`，最多需要`c+1`步。当然因为只能转换字符就先假设两个字符长度相等，通过最多一步把最后一位转换成正确的字符，然后再通过`c`步转换其他的就可以了。

然后上述3种情况就包含了所有可能的变化了，一次只能执行一种变化，所以总共需要的最少次数，一定是3者中最少的那一个，所以是`min(a, b, c)`。

而刚刚思考的是变化最多的情况，那最少又是如何，稍加思考就可以得出，对于各种情况，变化最少的情况是最后一位相同，假设`abc`变化到`ab`需要`n`步，那`abc`变化到`ab+c`，也就是最后一位相同，就是变化最少的情况了。

那么对于上面的3种假设最少的变化步数又是多少，整理一下

1. 只能用加法的情况下，原本`a`步，最后一位一样最少还是要`a+1`步，因为无论最后一位是否一样都需要加一个字符。
2. 反之亦然，原本`b`步，最少`b+1`步。
3. 只能用转换的情况下，原本`c`步，可以发现，最少还是`c`步，因为长度一样，最后多了一位但不需要变化，操作数量不变。

所以整理以上逻辑，可以得出类似的状态转移方程式：

假设word1转换到word2需要的3种情况的次数分别是`a, b, c`次，也就是

- 情况1：word1添加一个字符 - a
- 情况2：word2添加一个字符 - b
- 情况3：word1替换一个字符 - c

则word1转换到word2+`任意字符`的次数是:

```
当 最后一位相同时
    次数 = min(a + 1, b + 1, c)
当 最后一位不同时
    次数 = min(a, b, c) + 1
```

但是但是，这个里面怎么看都有3个未知量，小学就学过是这种是解不出来的。

所以我们至少需要找出一种实际值，于是我们可以思考到，假设一个字符串为空，那么对于任意一个字符，他一定是需要1次变化，这也就是情况1和情况2，而对于情况3，空字符串转换到空字符串毫无疑问是0次。

所以可以写出如下的二维矩阵：

```
    ''  r   o   s

''  0   1   2   3

h   1

o   2

r   3

s   4

e   5

```

第一行代表`''`分别转换到`r, ro, ros`的次数，第一列则表示`''`分别转换到`horse`中到每个字符为止的字符串的次数。

而对角线就表示了到当前位置为止的字符串相互转换的次数，比如左上角的空转换到空为0。

这样我们就相当于有了初始的`a, b, c`的值，接下来只要按照我们上面的规则填充好就可以了。

```
    ''  r   o   s

''  0   1   2   3

h   1   1   2   3

o   2   2   1   2

r   3   2   2   2

s   4   3   3   2

e   5   4   4   3

```

对于每一个点`x, y`，相当于到`x`为止的字符串，转换到到`y`为止字符串需要的最少次数，就是我们需要的编辑距离，那么右下角那个点就是最终结果了，需要3次。

接下来我们只要按照上面这个矩阵的计算逻辑，把代码写出来即可。

### 代码

```js
/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
var minDistance = function(word1, word2) {
    let m = word1.length
    let n = word2.length
    // 初始化第一行的数据
    let dp = Array(n + 1)
    for (let i = 0; i <= n; i++) {
        dp[i] = i
    }

    // 用prev记录上一行的数据
    let prev
    // 从第二行开始遍历
    for (let i = 1; i <= m; i++) {
        prev = dp
        // 置空当前行，并设置当前行的第一位
        dp = [i]

        // 从第二行开始遍历
        for (let j = 1; j <= n; j++) {
            // 此处的判断参考上面的状态转移方程式
            if (word1[i - 1] === word2[j - 1]) {
                dp[j] = Math.min(
                    dp[j - 1] + 1,
                    prev[j] + 1,
                    prev[j - 1]
                )
            } else {
                dp[j] = Math.min(
                    dp[j - 1],
                    prev[j],
                    prev[j - 1],
                ) + 1
            }
        }
    }

    return dp[n]
};
```

大概的复杂度如下：

- 时间复杂度是`O(mn)`，因为对所有元素都遍历了一遍。
- 空间复杂度则为`O(n)`，因为一共创建了两个长度为`n`的数组。

## 总结

上述的距离又叫做[莱文斯坦距离](https://baike.baidu.com/item/%E8%8E%B1%E6%96%87%E6%96%AF%E5%9D%A6%E8%B7%9D%E7%A6%BB)，是常用的编辑距离表示方法。

而对于[vue-cli](https://github.com/vuejs/vue-cli)来说，内部使用的是[leven](https://github.com/sindresorhus/leven)这个库去计算的，内部对字符串进行了其他细节优化，有兴趣的可以去看一下源代码。

前端虽然对算法直接使用比较少但是算法还是无处不在。
## 参考

- [编辑距离](https://leetcode-cn.com/problems/edit-distance/)
- [leven](https://github.com/sindresorhus/leven)