# bitwise-calc (位运算加减乘除)

## 前言

来尝试使用位运算实现加减乘除吧。

## 加法

加法是最重要的，因为其他运算都是基于加法的，减法相当于加上负数，乘法相当于多次加，除法相当于多次减。

比如现在有两个二进制数：`101`和`110`。

就和10进制一样，我们知道二进制相加可以有以下几种情况。

- 1 + 0 => 1
- 0 + 0 => 0
- 0 + 1 => 1
- 1 + 1 => 0 再进一位

而上面这几个操作，只看数字的话不管进位的话，就和*异或*操作一样。

而对于进位的话，只有两个位数都是1的情况下才会进位，可以相当于是*与*操作，然后再使用*左移*操作进位。

所以如果写成10进制的话，加法可以这样表示：

```js
5 + 6 // => 11
(5 ^ 6) + ((5 & 6) << 1) // => 11
```

前者*异或*相当于先把不进位的数字算出来，再去通过*与*运算算进位的数字。

写成代码可以这样：

```js
function add(a, b) {
    return (a ^ b) + ((a & b) << 1)
}
```

不过这样还是用到了加法，那么我们就可以这样想，万一后面这一串`((a & b) << 1)`为0，也就是说不用进位，那么前面的这部分`(a ^ b)`就是结果了，所以可以使用递归的思路去写这个算法，只要后面那一串不为0则不断计算。

```js
function add(a, b) {
    if (!b) return a ^ b
    else return add(a ^ b, (a & b) << 1)
}
```

用迭代可以这样写：

```js
function add(a, b) {
    while (b) {
        let temp = a
        a ^= b
        b = (temp & b) << 1
    }

    return a 
}
```

要注意的是因为是原本的数字相加，所以要用一个临时变量储存一下a。

这样一来加法就写好了，后续的实现起来就相对简单许多。

## 减法

相当于加上负数，负数相当于取反再+1

```js
function subtract(a, b) {
    return add(a, add(~b, 1))
}
```

## 乘法 

相当于不断加，注意符号即可。

```js
function multiply(a, b) {
    if (!a || !b) return 0

    let isPositive = false
    if ((a > 0 && b > 0) || (a < 0 && b <0)) {
        isPositive = true
    }

    a = Math.abs(a)
    b = Math.abs(b)

    let ans = 0
    while (b-- > 0) {
        ans = add(ans, a)
    }

    return isPositive ? ans : add(~ans, 1)
}
```

## 除法

和乘法类似，相当于不断减，直到被减数小于减数。

```js
function divide(a, b) {
    if (!b && !a) return NaN
    if (!a) return 0
    if (!b) return a > 0 ? Infinity : -Infinity

    let isPositive = false
    if ((a > 0 && b > 0) || (a < 0 && b <0)) {
        isPositive = true
    }

    a = Math.abs(a)
    b = Math.abs(b)

    let ans = 0
    while (a >= b) {
        a = subtract(a, b)
        ans++
    }

    return isPositive ? ans : add(~ans, 1)
}
```

## 总结

不过以上的实现都是针对整数而不是小数，同时位运算在JS中如果对于过大的数字（转换为2进制后达到了32位及以上），也会有问题要注意。

## 参考

- [两整数之和](https://leetcode-cn.com/problems/sum-of-two-integers/)