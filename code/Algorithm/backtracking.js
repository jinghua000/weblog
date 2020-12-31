/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permute = function(nums) {
    const length = nums.length
    const result = []
    const visited = Array(length).fill(false)

    loop([])

    return result 

    function loop (arr) {
        if (arr.length === nums.length) {
            result.push(arr.slice())
            return 
        }

        for (let i = 0; i < nums.length; i++) {
            if (visited[i]) continue

            // 将当前位设置为已访问
            visited[i] = true
            // 把当前数字暂存起来
            arr.push(nums[i])

            loop(arr)

            // 去除最后一个数字
            arr.pop()
            // 将当前位设置为未访问
            visited[i] = false
        }
    }
};

console.log(permute([1, 2, 3]))