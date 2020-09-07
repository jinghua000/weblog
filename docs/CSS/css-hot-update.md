# css-hot-update (css热更新原理)

## 是什么

在我们使用[`webpack-dev-server`](https://github.com/webpack/webpack-dev-server)或者其他工具进行开发的时候，经常修改了`css`但是页面没有刷新就生效了，就是所谓的这个热更新效果。

这次我们就稍微说明一下这个的原理（其实就很简单），具体的与后台文件修改关联起来的热更新前端页面的可以参考[`simple-client-hot-reload`](../Node/simple-client-hot-reload.md)以及[`simple-hmr`](../Node/simple-hmr.md)这两篇文章，这里就不演示了。

## 准备

准备一个样式文件

> style.css

```css
body {
  color: red;
}
```

然后一个页面

> index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  hello world
  <button onclick="change()">Click!</button>
</body>
<script>
  function change () {
    // ...
  }
</script>
</html>
```

我们引入刚刚的样式文件，然后放置一个按钮，在点击按钮的时候更新样式，假装是文件修改触发的热更新。

然后只要稍微加工一下`change`函数即可。

```js
function change () {
  const sheets = document.getElementsByTagName('link')
  const head = document.getElementsByTagName('head')[0]

  for (const sheet of sheets) {
    head.removeChild(sheet)
    head.appendChild(sheet)
  }
}
```

去除`link`标签再加载上去，这样就加载到的是最新的文件了。

> 这里只是简单的做一个样子所以没有判断加载的是不是css之类的。

来实际尝试一下，修改`css`文件保存之后点击按钮。

好的变化了！（假装此处有图）

## 总结

简单的`css`热更新就可以去除再加载`link`标签达到的，可以在`文件url`后加一些比如时间戳之类的让文件名一定不重复来防止缓存。如果是类似[`live-server`](https://github.com/tapio/live-server)那种简单的热更新在修改`html`内的`style`样式会直接刷新页面，而对于[`webpack-dev-server`](https://github.com/webpack/webpack-dev-server)那种打包再渲染的模式就可以把文件内的`css`先单独提取出来，在监听到变化的时候把那些内容加载到前端然后再替换就可以了，和局部更新`js`文件类似。

## 参考

- [`simple-hmr`](../Node/simple-hmr.md)
- [`simple-client-hot-reload`](../Node/simple-client-hot-reload.md)
- [`live-server`](https://github.com/tapio/live-server)
- [相关代码](../../code/CSS/css-hot-update/index.html)