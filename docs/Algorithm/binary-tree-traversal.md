# binary-tree-traversal (二叉树的前，中，后，层序遍历)

## 是什么

今天来整理一下二叉树的各种遍历模式，他们在各种情况下都挺有用的。

## 准备

首先准备一个如下所示的二叉树

```
     1
   /   \
  2     3
 / \   / \
4   5 6   7
```

代码大概是这样

```js
const root = {
  val: 1,
  left: {
    val: 2,
    left: {
      val: 4,
    },
    right: {
      val: 5,
    },
  },
  right: {
    val: 3,
    left: {
      val: 6,
    },
    right: {
      val: 7,
    },
  },
}
```

## 递归

遍历二叉树比较直观的方法就是递归，也比较容易理解，不停的去访问左节点，然后再访问右节点。前中后序分别就是访问根节点的时机不同。

- 前序 -> root, left, right
- 中序 -> left, root, right
- 后序 -> left, right, root

三者的递归写法很像，如下所示。

> 前序遍历

```js
function preorder (root) {
  const result = []

  function loop (node) {
    if (!node) return 

    result.push(node.val)
    loop(node.left)
    loop(node.right)
  }
  
  loop(root)
  return result
}

// => [ 1, 2, 4, 5, 3, 6, 7 ]
```

> 中序遍历

```js
function inorder (root) {
  const result = []

  function loop (node) {
    if (!node) return 

    loop(node.left)
    result.push(node.val)
    loop(node.right)
  }
  
  loop(root)
  return result
}

// => [ 4, 2, 5, 1, 6, 3, 7 ]
```

> 后序遍历

```js
function postorder (root) {
  const result = []

  function loop (node) {
    if (!node) return 

    loop(node.left)
    loop(node.right)
    result.push(node.val)
  }
  
  loop(root)
  return result
}

// => [ 4, 5, 2, 6, 7, 3, 1 ]
```

可以看到事实上唯一的区别就是处理节点的时机。

而层序遍历的递归写法就稍微有点不一样，因为以上三种说到底都是属于DFS（深度优先搜索），而层序遍历则是BFS（广度优先搜索）所以通过递归不是那么直观，不过也可以做到。

> 层序遍历

```js
function levelorder (root) {
  const result = []

  function loop (node, n = 0) {
    if (!node) return 

    result[n] || (result[n] = [])
    result[n].push(node.val)

    loop(node.left, n + 1)
    loop(node.right, n + 1)
  }
  loop(root)

  return result.reduce((acc,cur) => { acc.push(...cur); return acc })
}

// => [ 1, 2, 3, 4, 5, 6, 7 ]
```

相当于对每一层单独存一个数组，然后再进行扁平化，不过比起递归的写法，层序遍历有更为直观的迭代写法，也是下面要说的。

## 迭代

所有递归都可以转换成迭代，上述的遍历也一样，这里先说层序遍历的迭代写法。

可以通过**队列**来实现，大致的思路是

- 把根节点加入队列。
- 移出当前队列中的所有项，并同时把对应移出项的左右节点（如果存在）加入队列。
- 重复上面那一步，直到队列为空。

> 层序遍历

```js
function levelorder2 (root) {
  const result = []
  const queue = []

  queue.push(root)
  while (queue.length) {
    let len = queue.length

    while (len-- > 0) {
      let node = queue.shift()
      result.push(node.val)

      node.left && queue.push(node.left)
      node.right && queue.push(node.right)
    }
  }

  return result
}

// => [ 1, 2, 3, 4, 5, 6, 7 ]
```

而对于前中后序遍历这种深度优先的算法用迭代写就稍微有点绕，做法是用一个栈去代替函数栈先去把所有左节点入栈，然后一个个出栈的同时把最后一个节点的右节点（如果存在）再入栈在重复上面的操作。

> 先序遍历

```js
function preorder2 (root) {
  const result = []

  let curr = root
  const stack = []

  while (curr || stack.length) {
    while (curr) {
      stack.push(curr)
      result.push(curr.val)
      curr = curr.left
    }

    curr = stack.pop()
    curr = curr.right
  }

  return result 
}

// => [ 1, 2, 4, 5, 3, 6, 7 ]
```

> 中序遍历

```js
function inorder2 (root) {
  const result = []

  let curr = root
  const stack = []

  while (curr || stack.length) {
    while (curr) {
      stack.push(curr)
      curr = curr.left
    }

    curr = stack.pop()
    result.push(curr.val)
    curr = curr.right
  }

  return result 
}

// => [ 4, 2, 5, 1, 6, 3, 7 ]
```

对于后序遍历则又更麻烦一点，因为要在遍历左右节点之后再返回来，所以需要判断在最后一位出栈之后，没有右节点或者右节点等于最后一位记录的节点则继续遍历，否则要把最后一位再入栈并且去遍历其右节点。

> 后序遍历

```js
function postorder2 () {
  const result = []

  let curr = root
  let prev
  const stack = []

  while (curr || stack.length) {
    while (curr) {
      stack.push(curr)
      curr = curr.left
    }

    curr = stack.pop()

    if (!curr.right || curr.right === prev) {
      result.push(curr.val)
      prev = curr
      curr = null
    } else {
      stack.push(curr)
      curr = curr.right
    }
  }

  return result 
}

// => [ 4, 5, 2, 6, 7, 3, 1 ]
```

## 总结

从算法的角度上来说，对于前中后序遍历这样**深度优先**用递归是比较直观的，而对于层序遍历这样的**广度优先**则使用队列比较直观。

## 参考

- LeetCode上各种树遍历
- [相关代码](../../code/Algorithm/binary-tree-traversal.js)