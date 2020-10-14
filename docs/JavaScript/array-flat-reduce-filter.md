# array-flat-reduce-filter (Array的flat, reduce, filter的简单实现)

## 是什么

这次来简单实现一些有代表性的Array的原生方法吧。

## flat

用作数组的扁平化，可以通过参数来控制层级。

算法思路
- 每次遍历数组的元素，如果是数组则再进行1级扁平化，如果不是则增加在后面。

```js
function flat (n) {
  if (n <= 0) return this

  return this.reduce((acc, cur) => {
    Array.isArray(cur) ? acc.push(...cur.flat(n - 1)) : acc.push(cur)

    return acc
  }, [])
}

Array.prototype.myflat = flat

console.log([1, 2, [[3]]].myflat(1))
// => [1, 2, [3]]
console.log([1, [2], [[3]]].myflat(Infinity))
// => [1, 2, 3]
```

## reduce

用作数组的累加，第一个参数每次累加函数的返回值会作为下次累加的参数，第二个参数如果存在则作为初始值。

```js
function reduce (fn, init) {
  let result, i

  if (arguments.length > 1) {
    result = init
    i = 0
  } else {
    result = this[0]
    i = 1
  }

  while (i < this.length) {
    result = fn(result, this[i])
    i++
  }

  return result
}

Array.prototype.myreduce = reduce

console.log([1,2,3].myreduce((acc, cur) => acc += cur)) // => 6
console.log([1,2,3].myreduce((acc, cur) => acc += cur, 10)) // => 16
```

## filter 

遍历数组的每一项，如果提供的回调返回值为真则将当前项加入结果中。

```js
function filter (fn, thisArg) {
  const result = []
  const arr = this

  thisArg = thisArg || arr

  for (let i = 0; i < arr.length; i++) {
    let temp = fn.call(thisArg, arr[i], i, arr)
    temp && result.push(arr[i])
  }

  return result
}

Array.prototype.myfilter = filter

console.log([1,2,3,4,5].myfilter(e => e >= 3)) // => [3, 4, 5]
console.log([0, '', false, {}].myfilter(Boolean)) // => [{}]
```

## 总结

总而言之了解一些基础算法也不是什么坏事，以上！

## 参考

- [Array.prototype.flat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat)
- [Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)
- [Array.prototype.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
