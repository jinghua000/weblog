# webpack-and-rollup (webpack与rollup一点对比)

## 是什么

理所当然的这两个都是打包工具

- [webpack](https://webpack.js.org/)
- [rollup](http://rollupjs.org/guide/en/)

## 为什么

如果是一般项目开发那么基本都是使用webpack，不过一些流行的库发现使用的基本都是rollup，于是来稍微简单的对比一下他们。

## 开始

先来写几个简单的文件吧。

```js
// demo.js

function foo () {
  bar()
  return 'i am foo'
}

function bar () {}
function baz () {}

export default foo
```

```js
// index.js

import foo from './foo'

console.log(foo())
```

导出一个函数，然后写两个空函数，并调用其中的一个，最后执行导出的函数，看看我们智能的打包工具会如何处理他吧！

### webpack

webpack选手上场了，现在是webpack选手的回合，webpack选手使出了他的基本配置。

```js
// webpack.config.js
const path = require('path')

module.exports = {
  mode: 'development',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webpack.umd.js'
  }
}
```

我们先来打包一个开发（development）模式的试试。

呃...不过这个打包出来的文件，虽然能够大概看出结构，不是里面的内容不是人类能看得懂的，大概是长这样。

```js
// ...

/***/ "./demo.js":
/*!*****************!*\
  !*** ./demo.js ***!
  \*****************/
/*! exports provided: foo */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"foo\", function() { return foo; });\nfunction foo () {\n  bar()\n  return 'i am foo'\n}\n\nfunction bar () {}\nfunction baz () {}\n\n \n\n//# sourceURL=webpack:///./demo.js?");

/***/ }),

// ...
```

具体为什么会变成这样先不管，不过我们可以很明显的看到，这个里面仍然包含了虽然定义了但是并没有被使用的`baz`函数，看来开发模式并不会帮忙去除无用的代码。

然后我们用他的生产（production）模式再试一下。

```js
!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";r.r(t),console.log("i am foo")}]);
```

哦哦！看上去代码被漂亮的压缩了，并且可以看到，没有被使用的`baz`函数已经不存在了。

那么再来定义更多的没用的东西吧！

```js
// demo.js
// ...

const aa = 123
let bb = 234
class MyClass {}
if (false) {
  console.log('cannot reach!')
}
```

总之随便试了几个，定义变量，类，以及无用的条件语句。

得到的结果是这些在最终的打包文件中完全不存在，真是可喜可贺，不愧是webpack。

### rollup

接下来轮到rollup选手了，rollup选手也使出了奥义，默认配置。

```js
// rollup.config.js

export default {
  input: 'index.js',
  output: {
    name: 'demo',
    file: 'dist/rollup.umd.js',
    format: 'umd'
  }
}
```

来打个包试试。

哦多！这个打出来的包好像我也看得懂嘛，并且和webpack不一样，开发模式就已经把冗余代码去掉了。

```js
(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  function foo () {
    return 'i am foo'
  }

  console.log(foo());

})));
```

然后我们也来试一下生产模式，不过需要说明的是rollup的生产模式并不是像webpack那么方便一句话就改好了的，需要借助一些插件。我们这里选择[terser](https://github.com/TrySound/rollup-plugin-terser)这个压缩插件。用法可以参考官方文档。

然后来看一下最终打包的结果。

```js
!function(n){"function"==typeof define&&define.amd?define(n):n()}((function(){"use strict";console.log("i am foo")}));
```

嗯...这仅仅是把之前的代码换了个名字给压扁了嘛，我也看得懂。当然，多余的代码也去除了。

## 总结

这篇只是单纯的叙述了一下两者肉眼可见的区别，关于这两者的真正的区别rollup的官方文档是这样说的。

> Rollup 已被许多主流的 JavaScript 库使用，也可用于构建绝大多数应用程序。但是 Rollup 还不支持一些特定的高级功能，尤其是用在构建一些应用程序的时候，特别是代码拆分和运行时态的动态导入 dynamic imports at runtime. 如果你的项目中更需要这些功能，那使用 Webpack可能更符合你的需求。

总而言之就是，webpack拥有一种`动态导入`的不得了的功能，那个可以考虑后面再了解一下吧。

另外理所当然的从打包结果也可以看出来了

> rollup的打包的大小比webpack的小很多。

总之结论就是

- 如果是一次性需要导入所有内容的库的话，还是选择rollup比较好。
- 如果是那种一整个大的应用程序，看上去webpack更为合适。

## 参考

- [相关代码](../../code/Node/webpack-and-rollup)