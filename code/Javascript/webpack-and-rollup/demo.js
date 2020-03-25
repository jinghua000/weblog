function foo () {
  bar()
  return 'i am foo'
}

function bar () {}
function baz () {}

export const aa = 123
export let bb = 234
export class MyClass {}
if (false) {
  console.log('cannot reach!')
}

export { foo } 