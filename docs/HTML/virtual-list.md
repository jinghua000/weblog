# vritual-list (虚拟列表)

## 前言

当一个页面需要显示很长的列表的时候一般有两种做法：

第一种是懒加载，就是所谓的无限滚动，每当滚动到底部的时候去添加新的数据，渲染对应的DOM。这种方式一般也是比较常用的，也能解决大部分问题。

第二种是可视区域加载，也就是所谓的虚拟列表，每次只加载当前能看到的部分DOM，随着页面往下滚动更新页面DOM的数据，让人感觉是正常滑动。是为了解决第一种方式在加载了很多很多数据的时候DOM节点过多而可能导致的一些问题。

这次就尝试实现一个虚拟列表看一下他的基本逻辑吧。

## 思路

大概思考一下需要以下几样东西。

1. 原始容器 - 这个就不用解释了，就是原本的盒子。
2. 用来滑动的容器 - 因为本身只会加载一定数量的DOM，不会撑起高度，所以需要设置一个总高度来模拟滑动以及滚动条的效果，不需要内容，只需要设置高度即可。
3. 用来显示内容的容器 - 也就是加载真正用来显示的数据，需要注意的是并不是只加载看得见的几个，而需要有一定预留，否则在滚动的时候就会出现不连续的现象，大概可以表示为下图的样子。虽然比较抽象不过如果是聪明的你一定看得懂吧。

```
    |  |  --> 预留区域
    |  |   
|——————————|
|          | 
|          | --> 显示区域 
|          | 
|——————————| 
    |  |
    |  |
```

主要需要的其实就是以上3块内容，接下来就要思考具体的实现逻辑了。

## 实现

实现分为以下几步，我们这里结合代码一步步实现。

### 初始化

在虚拟列表的实现过程中需要的状态很多，所以我们创建一个类来储存这些状态。

```js
class VritualList {

    constructor(container, options = {}) {
        // 原始容器
        this.container = container
        // 列表数据 NODE节点数组
        this.data = options.data
        // 最大加载数量
        this.maxCount = options.maxCount
        // 最条数据的高度
        this.itemHeight = options.itemHeight

        this.init()
    }

// ...
```

我们通过参数传递了一些需要初始储存的状态，我们是为了做基本的演示，所以数据用的直接是生成好的Node节点，另外每条内容也保证是是等高的。

然后初始化其他需要计算的内容，这部分比较多写在init里。

```js
// ...

    init() {
        // 容器高度
        this.containerHeight = this.container.clientHeight
        // 总数据
        this.total = this.data.length
        // 已加载的第一个index
        this.start = 0
        // 已加载的最后一个index
        this.end = 0
        // 目前滚动条位置
        this.scrollTop = 0
        // 上次滚动条位置
        this.oscrollTop = 0
        // 预留数量 
        this.reserveCount = this.getReserveCount()
        // 包装用div
        this.wrapperNode = this.createWrapper()
        // 滚动用div
        this.scrollBarNode = this.createScrollBar()
        // 展示列表用div
        this.scrollListNode = this.createScrollList()

        this.wrapperNode.onscroll = this.handleScroll.bind(this)
        this.wrapperNode.append(this.scrollBarNode, this.scrollListNode)
        this.container.append(this.wrapperNode)

        this.end = this.start + this.maxCount
        this.scrollListNode.append(...this.data.slice(this.start, this.end))
    }

// ...
```

总体上除了必要的高度以外，其余就是一些需要计算得出的变量。比如我们这里设置的`预留数量`，这个记录的是当前看见的元素到加载出的元素的最大距离，算法也很简单。

```js
// ...

    // 预留数量 相当于current - start的最大数量
    getReserveCount() {
        const oneScreenShow = Math.floor(this.containerHeight / this.itemHeight)
        // (总体显示的数量 - 一个屏幕最多显示的数量) 的一半
        return Math.floor((this.maxCount - oneScreenShow) / 2)
    }

// ...
```

而当前可以看得见的元素序号，可以用顶部距离除以高度来得到。

```js
// ...

    get current() {
        return Math.floor(this.scrollTop / this.itemHeight)
    }

// ...
```

然后我们创建了3个需要使用的div，层级如下。

- container
  - wrapper
    - scroll-bar
    - scroll-list

`wrapper`填满整个`container`，设定相对定位超出部分滚动。

```js
// ...

    createWrapper() {
        const node = document.createElement('div')
    
        node.style.width = '100%'
        node.style.height = '100%'
        node.style.position = 'relative'
        node.style.overflow = 'auto'
    
        return node 
    }

// ...
```

`scroll-bar`设置总体高度即可。

```js
// ...

    createScrollBar() {
        const node = document.createElement('div')
    
        node.style.height = this.total * this.itemHeight + 'px'
    
        return node 
    }

// ...
```

`scroll-list`绝对定位到左上角，填满横向区域。

```js
// ...

    createScrollList() {
        const node = document.createElement('div')
    
        node.style.position = 'absolute'
        node.style.left = 0
        node.style.top = 0
        node.style.width = '100%'
    
        return node 
    }

// ...
```

初始化了这些之后就把最开始一批数据填充进去即可。

```js
// ...

    this.end = this.start + this.maxCount
    this.scrollListNode.append(...this.data.slice(this.start, this.end))

// ...
```

### 滚动事件处理

接下来就是要处理滚动事件了，这也是相对比较复杂的地方。

首先滚动事件可以分为往下滚和往上滚，所以可以设置一个上次滚动的位置来对比区分滚动方向。

然后对于往下滚和往上滚分别有自己的处理方式，整理一下思路大概可以如下描述。

- 往下滚 - 如果当前可见的元素距离第一个加载的元素超过了预留数量，则不断的去从列表头部移除多余的元素，同时相同数量元素向尾部添加。
- 往上滚 - 如果列表中第一个加载出的元素不是首个元素，并且距离当前可见元素距离小于预留数量，则不断的将元素加入到列表头部，如果整体加载出的元素多于整体可加载元素的最大数量，则多余的元素从尾部移除。

代码可以表示如下

```js
// ...

    scrollNext() {
        const listNode = this.scrollListNode
        while (this.current - this.start > this.reserveCount) {
            this.start++
            listNode.firstChild.remove()
    
            if (this.end < this.total) {
                listNode.append(this.data[this.end++])
            }
        }
    }

    scrollPrev() {
        const listNode = this.scrollListNode
        while (this.start && this.current - this.start < this.reserveCount) {
            listNode.prepend(this.data[--this.start])
    
            if (this.end - this.start >= this.maxCount) {
                this.end--
                listNode.lastChild.remove()
            }
        }
    }

// ...
```

然后在对列表中的元素进行过操作之后，列表的高度还是不变的，但是滚动条却已经滚到更远的地方了，所以要对列表的定位加以处理，具体的处理规则是：

将列表向下偏移开始渲染位置的序号乘以元素高度

这样相对于最外层的容器看上去就是正常的滚动了，代码如下：

```js
// ...

    handleScroll() {
        this.scrollTop = this.wrapperNode.scrollTop
        if (this.scrollTop > this.oscrollTop) {
            this.scrollNext()
        } else {
            this.scrollPrev()
        }

        this.oscrollTop = this.scrollTop
        this.scrollListNode.style.transform = `translateY(${this.start * this.itemHeight}px)`
    }

// ...
```

### 引入

好了，到此为止`VritualList`类已经实现完毕了，接下来就是要在外部引入，我们写一个简单的例子来试验一下效果。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #container {
            width: 250px;
            height: 500px;
            background: WhiteSmoke;
        }

        .item {
            margin-bottom: 15px;
            height: 50px;
            background: lightblue;
            border: 1px solid gray;
        }
    </style>
</head>
<body>
    <div id="container"></div>
</body>
<script src="virtual-list.js"></script>
<script>
    function createItem(index) {
        const node = document.createElement('div')
        node.className = 'item'
        node.textContent = '我是' + index
        return node
    }

    const TOTAL_COUNT = 1e4
    const data = Array(TOTAL_COUNT)
    for (let i = 0; i < TOTAL_COUNT; i++) {
        data[i] = createItem(i)
    }

    new VritualList(
        document.getElementById('container'),
        {
            data,
            maxCount: 20,
            itemHeight: 65,
        }
    )
</script>
</html>
```

我们这里尝试加载一万条数据，然后每次最多加载20条，来尝试一下具体效果。

![virtual-list.gif](../../assets/virtual-list.gif)

可喜可贺，成功实现了虚拟列表的效果。

## 总结

这次尝试使用原生JS实现了虚拟列表，在对应框架里就不需要自己去操作DOM可以只管数据就好了。

不过只有数据量特别特别大才需要这种虚拟列表，普通的用无限滚动就基本可以满足了。另外对于不定高度的需要在设置高度的部分动态的去计算高度，大家在其他地方找例子就好，比如参考里的[lite-virtual-list](https://github.com/wensiyuanseven/lite-virtual-list)这个库也可以。

另外如果想要对于滚动事件进行节流操作需要注意最后一次滚动操作必须要触发，否则可能会造成通知位置不正确的情况。

最后祝你身体健康。

## 参考

- [聊聊前端开发中的长列表](https://zhuanlan.zhihu.com/p/26022258)
- [lite-virtual-list](https://github.com/wensiyuanseven/lite-virtual-list)
- [相关代码](../../code/HTML/virtual-list/virtual-list.js)
