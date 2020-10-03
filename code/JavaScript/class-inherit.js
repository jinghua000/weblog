{
  console.log('=====class based=====')
  class Animal {

    constructor (name) {
      this.name = name
    }
  
  }
  
  class Rabbit extends Animal {
  
    constructor (...args) {
      super(...args)
      this.isRabbit = true
    }
  
  }
  
  let rabbit = new Rabbit('foo')
  console.log(rabbit)
  console.log(rabbit.__proto__ === Rabbit.prototype) 
  console.log(rabbit.__proto__.__proto__ === Animal.prototype)
}

{
  console.log('=====function based=====')

  function Animal (name) {
    this.name = name
  }

  // function Rabbit (...args) {
  //   Animal.call(this, ...args)
  //   this.isRabbit = true
  // }

  // Rabbit.prototype = Object.create(Animal.prototype)

  function extend (parent, child) {
    const result = function (...args) {
      parent.call(this, ...args)
      child.call(this, ...args)
    }

    result.prototype = Object.create(parent.prototype)
    return result
  }

  const Rabbit = extend(Animal, function (...args) {
    this.isRabbit = true
  })

  let rabbit = new Rabbit('foo')
  console.log(rabbit)
  console.log(rabbit.__proto__ === Rabbit.prototype) 
  console.log(rabbit.__proto__.__proto__ === Animal.prototype)
}