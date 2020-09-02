'use strict'

const { effect } = require('./effect')
const { reactive, ref } = require('./reactive')

{
  console.log('======1======')
  let dummy
  const obj = reactive({ num: 0 })

  effect(() => dummy = obj.num)

  obj.num = 123
  console.log(dummy) // => 123

  obj.num++
  console.log(dummy) // => 124
}

{
  console.log('======2======')
  let dummy
  const obj = reactive({ a: { b: 0 } })

  effect(() => dummy = obj.a.b)
  obj.a.b++
  console.log(dummy) // => 1
}

{
  console.log('======3======')
  let dummy
  const arr = reactive([0, [0]])

  effect(() => dummy = arr[1][0])
  arr[1][0]++
  console.log(dummy) // => 1
}

{
  console.log('======4======')
  
  let dummy
  const count = ref(1)

  console.log(count.value) // => 1

  effect(() => dummy = count.value)

  count.value++
  console.log(dummy) // => 2
}