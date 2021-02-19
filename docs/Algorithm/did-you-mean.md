# did-you-mean (Did you mean?)

这次来尝试实现一下`did you mean`效果。

具体来说就是比如我们使用一些cli工具的时候，如果打错了几个字，则会提示你要输入的是不是别的什么东西。

比如使用vue-cli打一个命令`vue create`的时候故意打错`vue creat`，就会有类似的提示。

```
Unknown command creat.

Did you mean create?
```

一般这种效果会使用[编辑距离](https://baike.baidu.com/item/%E7%BC%96%E8%BE%91%E8%B7%9D%E7%A6%BB)去计算，当编辑距离小于一定数量时，则认为相差不大。

一般意味着每次可以插入，删除，或替换一个字符，计算整个操作的次数。

那么就需要一个，计算两个字符串相差字符个数的算法。

变成算法题了有没有，刚好LeetCode上也有一道类似的[题目](https://leetcode-cn.com/problems/edit-distance/)。

## 题目 - 编辑距离

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

## 参考

- [编辑距离](https://leetcode-cn.com/problems/edit-distance/)