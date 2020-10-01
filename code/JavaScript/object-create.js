// function create (obj) {
//   const newObj = {}
//   newObj.__proto__ = obj
//   return newObj
// }

// function create (obj) {
//   const newObj = {}
//   Object.setPrototypeOf(newObj, obj)
//   // Reflect.setPrototypeOf(newObj, obj)
//   return newObj
// }

function create (obj) {
  function f () {}
  f.prototype = obj
  return new f()
  // return Reflect.construct(f, []) 
}

const foo = {}
const bar = create(foo)
console.log(Object.getPrototypeOf(bar) === foo)