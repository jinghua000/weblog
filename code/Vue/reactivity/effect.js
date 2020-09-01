function effect (fn) {
  function tmp (...args) {
    fn(...args)
  }

  tmp()

  return tmp
}