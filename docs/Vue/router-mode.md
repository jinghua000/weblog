# router-mode (history和hash模式路由的简易实现)

## 是什么

[vue-router](https://router.vuejs.org/)在浏览器环境下有两种可以选择的路由模式，这次来分别了解一下他们的原理并且简单实现一下。

- 默认是`hash`，链接上会有一个`/#/`然后其他内容跟在后面
- 也可以选择`history`，链接看上去和普通的页面链接一样

## 事先准备

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Router Mode</title>
</head>
<body>
  <div id="router-view">
    default
  </div>
  <a href="/foo">foo</a>
  <a href="/bar">bar</a>
</body>
<script>
  const RouterMap = {
    'foo': 'this is foo',
    'bar': 'this is bar',
  }

  function useHashRouter () {
    // ...
  }

  function useHistoryRouter () {
    // ...
  }
</script>
</html>
```

准备一个`div`假装里面的内容就是动态的路由页面，我们希望点击`a`标签的时候可以分别实现`hash`路由和`history`路由链接上的效果，再通过路由表去更新`div`里的内容。

## 实现hash路由

我们先从简单的开始，顾名思义，`hash`就是链接中`#`以及之后的一串，并且`hash`里的值无论怎么变化都不会去访问新的页面，即不会出现打出一长串不存在的路径然后然后404的问题。

那我们首先把`a`标签里的链接改一下。

```html
<a href="#/foo">foo</a>
<a href="#/bar">bar</a>
```

现在点击标签`url`已经会变了，接下来只要去监听`url`的变化，可以通过[`onhashchange`](https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange)这个事件。