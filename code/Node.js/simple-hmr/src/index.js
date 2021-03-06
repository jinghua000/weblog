import { component } from './component'

console.log('index loaded')

let element = component()
document.body.appendChild(element)

if (module.hot) {
  module.hot.accept('./component', function () {
    console.log('something change!')

    document.body.removeChild(element)
    element = component()
    document.body.appendChild(element)
  })
}