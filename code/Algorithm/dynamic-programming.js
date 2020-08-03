'use strict'

function f (n) {
  if (n <= 2) return n

  return f(n - 1) + f(n - 2)
}

// console.log('使用递归', f(10))

function calc (n) {
  // 我们通常可以使用数组来代替状态转移方程中的函数，也便于理解
  const dp = []

  dp[1] = 1
  dp[2] = 2

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
  }
  
  return dp[n]
}

// console.log('动态规划', calc(10))


function calc2 (n) {
  if (n <= 2) return n

  let first = 1, second = 2, sum

  for (let i = 3; i <= n; i++) {
    sum = first + second
    first = second
    second = sum
  }

  return sum
}

// console.log('最简化', calc2(10))

function rob (nums) {
  const dp = [0, nums[0]]
  const len = nums.length

  for (let i = 2; i <= len; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1])
  }

  return dp[len]
}

// console.log(rob([10,1,5,1]))
// console.log(rob([10,1,5,10]))

function rob2 (nums) {
  let a = 0
  let b = nums[0] || 0
  let result = b

  for (let i = 2; i <= nums.length; i++) {
    result = Math.max(b, a + nums[i - 1])
    a = b
    b = result 
  }

  return result 
}

// console.log(rob2([10,1,5,1]))
// console.log(rob2([10,1,5,10]))
