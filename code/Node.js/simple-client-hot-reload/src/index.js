function component () {
  const el = document.createElement('div')
  
  el.innerHTML = 'something else... www'
  
  return el
}

document.body.appendChild(component())