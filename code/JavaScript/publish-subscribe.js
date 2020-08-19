'use strict'

class Channel {

  constructor () {
    this.subscribers = new Set()
  }

  subscribe (subscriber) {
    this.subscribers.add(subscriber)
  }
  
  remove (subscriber) {
    this.subscribers.delete(subscriber)
  }

  publish (msg) {
    this.subscribers.forEach(subscriber => {
      subscriber.notify(msg)
    })
  }

}

class Subscriber {

  constructor (username) {
    this.username = username
  }

  notify (msg) {
    console.log(`"${this.username}"订阅了一则消息！`)
    console.log(`消息的内容是：${msg}`)
  }

}

const sub1 = new Subscriber('小明')
const sub2 = new Subscriber('小红')
const sub3 = new Subscriber('伊丽莎白二世')

const channel = new Channel()
channel.subscribe(sub1)
channel.subscribe(sub2)
channel.subscribe(sub3)
channel.subscribe(sub3)

channel.publish('倒闭了')
channel.publish('跑了')

channel.remove(sub1)
channel.remove(sub2)

channel.publish('复活了')