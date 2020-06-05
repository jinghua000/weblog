import foo from './foo'
import bar from './bar'

console.log('component loaded')

export function component () {
  const elem = document.createElement('div')
  elem.innerHTML = 'this is a component with ' + foo + ' and ' + bar

  return elem
}
