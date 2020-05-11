# proc-to-lambda (proc转lambda)

## 是什么

- [Proc](https://ruby-doc.com/core/Proc.html)是Ruby中的一种代码块，特点是不依赖上下文可以在各种环境下运行。

- [lambda](https://ruby-doc.com/core/Proc.html#method-i-lambda-3F)是一种比较特殊的代码块，和proc相似但是有些许区别，比如: 

> - 参数数量必须传递正确
> - 可以在代码块内部进行return
> - 等等...

## 为什么

为了让一些代码块拥有lambda的特性。

比如下面这一种情况：

```ruby
def call_block(*args, &block)
  block.call(*args)
end

def calc1
  # 因为某种原因块内需要使用return返回 而 block的类型是Proc 会直接退出整个方法
  # 好吧 可能基本不会有这种写法 不过这只是一个例子 意思是说有时我们需要在代码块内return
  num1 = call_block(1) do |x|
    # do something...
    return x
  end

  num2 = 1

  num1 + num2
end

puts calc1 # => 1
```

而如果那个地方的`block`能直接变成`lambda`就能得到我们预想的效果了

比如：

```ruby
def calc2
  # 我们希望上面那个例子也能得到类似的效果
  num1 = lambda do |x|
    return x
  end.call(1)

  num2 = 1

  num1 + num2
end

puts calc2 # => 2
```

事实上在代码块内return是非常常见的设计，比如[Grape](https://github.com/ruby-grape/grape)。

于是我们来想办法把Proc转换成lambda。

## 实现

在实现之前，先来介绍一种比较常用的代码块的用法。

根据代码块内不依赖上下文的特性，可以在不同的上下文中复用。

比如:

```ruby
class AA; def demo; 123; end; end;
class BB; def demo; 234; end; end;

demo_proc = proc { demo }

puts(AA.new.instance_exec &demo_proc) # => 123
puts(BB.new.instance_exec &demo_proc) # => 234

# 虽然都是调用demo方法 但是保留了每个环境自己的上下文 这个特性让代码块变得很灵活
```

所以我们实现出的 proc 转 lambda 自然也要保留这个特性。

实现方法如下：

```ruby
def convert_proc_to_lambda(source_proc)
  # 如果自身就是lambda了就返回自身
  return source_proc if source_proc.lambda?

  # 定义一个新的模块 以proc定义一个新的实例方法
  unbound_method = Module.new.module_eval do
    instance_method(define_method(:_, &source_proc))
  end

  # 用实例方法绑定执行时的self
  lambda do |*args, &block|
    unbound_method.bind(self).call(*args, &block)
  end
end
```

测试一下

```ruby
lambda_demo_proc = convert_proc_to_lambda(demo_proc)

puts lambda_demo_proc.lambda? # => true
puts(AA.new.instance_exec &lambda_demo_proc) # => 123
puts(BB.new.instance_exec &lambda_demo_proc) # => 234
```

看上去不仅转成了lambda类型并且能够保留在不同上下文中运行。

把最开始的那个方法改写一下:

```ruby
def call_block(*args, &block)
  convert_proc_to_lambda(block).call(*args)
  # block.call(*args)
end
```

然后再执行原本的`calc1` `calc2`方法（代码不变）。

```ruby 
puts calc1 # => 2
puts calc2 # => 2
```

看上去在代码块内部return的特性也成功了，可喜可贺。

## 总结

这个写法参考了最下方stackoverflow的评论。

我其实也没有理解的十分彻底，不过这种实现方式在各种情况下看上去都没有问题。

按照文中的实现方法封装的[gem](https://github.com/jinghua000/proc-to-lambda)。

## 参考

- https://stackoverflow.com/questions/2946603/ruby-convert-proc-to-lambda
- [proc-to-lambda](https://github.com/jinghua000/proc-to-lambda)
- [相关代码](../../code/Ruby/proc-to-lambda.rb)