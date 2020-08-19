# lazyload-js (懒加载js)

## 是什么

懒加载，又称按需加载，在项目比较大的时候，一次性加载完所有东西明显不合适，只加载需要的东西看上去是比较合适的，这个特性在webpack中非常常用。

> [webpack对于lazyload的描述](https://webpack.js.org/guides/lazy-loading/)

## 目标

比起对于模块的按需加载，我们先实现一个简单的按需加载js文件了解其原理。

## 实现

说实话这有点简单，使用`script`标签就可以了，我们先准备一点素材。

> index.html

```html
<body>
  <button onclick="clickMe()">Click Me!</button>
  <script>
    
    function clickMe () {
      
    }

  </script>
</body>
```

> code.js

```js
console.log('code loaded!')
window.code = 'i am code'
```

这里我们写了一个按钮，假装在点击按钮的时候通过远程加载到js文件。

所以我们需要一个`lazyLoad`函数来达到这一效果。

```js
    // 设定一个已经加载过的js文件集合
    const installedModules = new Set()
    function lazyLoad (dep) {
      // 如果已经加载过就停止
      if (installedModules.has(dep)) return Promise.resolve()

      installedModules.add(dep)
      // 动态插入一个script标签，返回Promise
      return new Promise(resolve => {
        const elem = document.createElement('script')

        elem.src = dep
        elem.onload = resolve

        document.body.appendChild(elem)
      })
    }
```

然后在原本的点击函数里加载`code`文件。

```js
function clickMe () {
  lazyLoad('./code.js')
    .then(() => console.log(code))
}
```

最后再点击一下按钮来看看效果。

```
code loaded!
i am code
```

加载出了文件的内容，并且文件内部的赋值也生效了，可喜可贺。

然后确认一下控制台的`Sources`模块，也加载出了一开始没有的`code.js`文件。

## 总结

总而言之这次了解了一下最基本的按需加载的原理，结合`webpack`使用的话，参考之前的[`simple-pack`](../Node/simple-pack.md)这篇文章，在打包的时候把所有需要按需加载的文件分开打包成不同的`js`文件，然后通过`import`之类的自定义接口去按需加载这些内容，嘛，原理和打包是差不多的，这里暂时就不去尝试实现了，再见！

## 参考

- [`simple-pack`](../Node/simple-pack.md)
- [相关代码](../../code/Javascript/lazyload-js)