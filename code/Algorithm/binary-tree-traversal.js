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

console.log('preorder:')
console.log(preorder(root))
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

console.log('inorder:')
console.log(inorder(root))
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

console.log('postorder:')
console.log(postorder(root))
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

console.log('levelorder:')
console.log(levelorder(root))
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

console.log('preorder2:')
console.log(preorder2(root))
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

console.log('inorder2:')
console.log(inorder2(root))
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

console.log('postorder2:')
console.log(postorder2(root))
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

console.log('levelorder2:')
console.log(levelorder2(root))
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
