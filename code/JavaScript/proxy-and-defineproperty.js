function define (obj) {
  const keys = Object.keys(obj)

  keys.forEach(key => {
    let value 

    Object.defineProperty(obj, key, {
      set (val) {
        console.log(`define: set key - ${key}, val - ${val}`)
        value = val
      },
      get () {
        console.log(`define: get key - ${key}`)
        return value
      },  
    })
  })

  return obj
}

function proxy (obj) {
  return new Proxy(obj, {
    set (target, prop, value, receiver) {
      console.log(`proxy: set key - ${prop}, val - ${value}`)
      return Reflect.set(target, prop, value, receiver)
    },
    get (target, prop, receiver) {
      console.log(`proxy: get key - ${prop}`)
      return Reflect.get(target, prop, receiver)
    },
  })
}

{
  console.log('=====1=====')
  let obj1 = define({})
  let obj2 = proxy({})
  obj1.foo = 123
  obj2.foo = 123 // => proxy: set key - foo, val - 123
}

{
  console.log('=====2=====')
  let arr1 = define([1,2,3])
  let arr2 = proxy([1,2,3])
  arr1[0] = 4 // define: set key - 0, val - 4
  arr1[4] = 5
  arr2[0] = 4 // proxy: set key - 0, val - 4
  arr2[4] = 5 // proxy: set key - 4, val - 5
  arr1.push(10)
  arr2.push(10)
  // proxy: get key - push
  // proxy: get key - length
  // proxy: set key - 5, val - 10
  // proxy: set key - length, val - 6
}