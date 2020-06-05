# simple-hmr (简单模块热替换)

## 是什么

[Hot Module Replacement (HMR)](https://webpack.js.org/concepts/hot-module-replacement/)，具体的含义可以去看链接里的详细描述，大概就是，当文件发生变化时，通过替换对应的模块而不用重新加载整个页面。

## 为什么

模块热替换只会在开发模式使用，好处的话大概是可以

1. 保留页面状态
2. 节省时间
3. css效果可以直接显示

## 目标

模仿`webpack`来实现一个针对`js`文件的模块热替换（不包括页面样式）。

> 这篇文章使用到了[`simple-pack`](./simple-pack.md)以及[`simple-client-hot-reload`](./simple-client-hot-reload.md)中的内容，重复部分将不在这篇文章中详细展开。

## webpack是什么样子的

参考`webpack`的[HMR使用指导](https://webpack.js.org/guides/hot-module-replacement/)，截取一些主要代码。

```js
// index.js
// ...

if (module.hot) {
  module.hot.accept('./print.js', function() {
    console.log('Accepting the updated printMe module!');
    document.body.removeChild(element);
    element = component(); 
    document.body.appendChild(element);
  })
}
```

大概的意思就是通过`module.hot.accept`方法，去监听`./print.js`以及其依赖们的变化，变化了之后则用会调用后面的回调函数，而不是全局刷新。

好的，既然知道了最终的样子，我们就来稍微写一点例子把。

## 实现准备

> src/index.js

```js
import { component } from './component'

console.log('index loaded')

let element = component()
document.body.appendChild(element)

if (module.hot) {
  module.hot.accept('./component', function () {
    document.body.removeChild(element)
    element = component()
    document.body.appendChild(element)
  })
}
```

> src/component.js

```js
import foo from './foo'
import bar from './bar'

console.log('component loaded')

export function component () {
  const elem = document.createElement('div')
  elem.innerHTML = 'this is a component with ' + foo + ' and ' + bar

  return elem
}
```

> src/foo.js

```js
console.log('foo loaded')

export default 'foo'
```

> src/bar.js

```js
console.log('bar loaded')

export default 'bar'
```

好了我们准备了一些文件来生成一个`dom`，然后也模仿`webpack`的方式来监听了一下文件的变化尝试来进行热更新，然后我们还需要一个作为首页的`html`文件。

> out/index.html

```html
<body>
  this is the body
</body>
<script src="bundle.js"></script>
```

我们这里引入了一个不存在的`bundle.js`的文件，这个文件是我们到时候打包整个`src/`文件夹生成的入口文件，现在先不管他。

好了，现在素材已经准备好了，可以开始进行下一步了。

## 思路整理

1. 把所有`src/`文件夹里的所有`js`文件打包成一个文件，每个文件当做一个模块。
2. 通过静态服务去代理`out/`下的静态文件以及通过`WebSocket`服务让前端文件与服务端进行关联。
3. 监听所有`src/`下文件的变化，一旦某个文件变化，则去重新打包那个文件，通过`WebSocket`把相关信息传递到前端。
4. 在前端尝试用模块替换更新变化的文件，执行对应的回调函数。
5. 如果没有设置模块替换，则进行全局刷新，即为`window.location.reload()`。