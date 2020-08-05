/**
 * @param {character[][]} matrix
 * @return {number}
 */
var maximalSquare = function(matrix) {
  if (!matrix.length) return 0

  const dp = Array(matrix.length).fill(0).map(
    () => Array(matrix[0].length).fill(0)
  )

  let max = 0
  for (let x = 0; x < matrix.length; x++) {
    for (let y = 0; y < matrix[x].length; y++) {
      if (!+matrix[x][y]) continue

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