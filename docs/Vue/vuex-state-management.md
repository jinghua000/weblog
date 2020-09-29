# vue-state-management (vuex的状态管理的简单实现)

## 是什么

所谓[状态管理](https://v3.vuejs.org/guide/state-management.html)，是为了让不同组件中相互通信以及便于记录状态的变化，在`vue`中一般使用`vuex`实现，为了了解他的基本原来来简单实现一下吧。

## 准备

因为`vue3`刚好发布了，我们这里就使用`vue3`先来写一个简单的例子。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>vue-state-management</title>
</head>
<body>
  <div id="app" style="text-align: center;">
    {{ count }}
    <br>
    <button @click="add">Add</button>
  </div>
</body>
<script type="module">
  import { 
    createApp, 
    reactive
  } from 'https://cdn.jsdelivr.net/npm/vue@3.0.0/dist/vue.esm-browser.js'

  const store = createStore({
    state: {
      count: 0,
    },
    mutations: {
      add (state, payload) {
        state.count += payload
      }
    }
  })

  function createStore (storeConfig) {
    // implementation this!
    // ...
  }

  const App = {
    computed: {
      count: vm => store.state.count
    },
    methods: {
      add () {
        store.commit('add', 1)
      },
    },
  }

  createApp(App).mount('#app')
</script>
</html>
```

如同例子所表示，像`vuex`先假装有一个状态配置。

```js
storeConfig = {
  state: {
    count: 0,
  },
  mutations: {
    add (state, payload) {
      state.count += payload
    }
  }
}
```

里面的`state`属性则是我们需要的公共状态，而`mutations`内部的方法则是更改状态的方案，然后从API上也仿造`vuex`，取得状态使用`store.state`，提交变化则通过`store.commit`。

## 实现

然后接下来就是实现`createStore`函数就好。

并且`vue3`有十分方便的把对象变为响应式的方法，我们可以使用[`reactive`](https://v3.vuejs.org/api/basic-reactivity.html#reactive)实现。

剩下的`commit`方法则通过参数判断想要调用的配置中的方法即可。

```js
function createStore (storeConfig) {
  // 将状态设置为响应式
  const state = reactive(storeConfig.state)

  return {
    state,
    // 通过不同的mutationType调用配置中不同的方法
    commit (mutationType, payload) {
      storeConfig.mutations[mutationType](state, payload)
    },
  }
}
```

虽然很简单，不过这样之后确实已经实现了基本的状态管理了。

稍微测试一下也没有问题，页面如同预料的更新了，可喜可贺！

## 总结

说到底状态管理就是把公共的状态提取出来然后按照一定规则去改变他，达到通信，管理的效果。代码很简单，主要理解这个思路即可。

## 参考

- [reactive](https://v3.vuejs.org/api/basic-reactivity.html#reactive)
- [状态管理](https://v3.vuejs.org/guide/state-management.html)
- [相关代码](../../code/Vue/vuex-state-management.html)