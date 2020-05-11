# heredocs (多行字符串)

## 是什么

所谓[heredocs](https://ruby-doc.org/core-2.7.1/doc/syntax/literals_rdoc.html#label-Here+Documents+-28heredocs-29)，就是多行字符串，在Ruby中的话是类似这个样子

```ruby
def demo

  puts <<~DOC
    是的
    是那个男人
  DOC

end

demo
```

然后输出就会这样

```
是的
是那个男人
```

## 为什么

一直不太清楚这个的用法，于是稍微整理一下。

## 特点

> 写这个文章的时候最新的Ruby版本是`2.7.1`，旧的我就不管了。

### 字面量作用不同

根据文档说所讲的一样，根据一开始的的字面量不同文字的缩进会有所不同。

比如`<<`开头，则结尾处必须不能缩进。

比如`<<-`开头，中间的内容也会显示缩进后的状态。

一开始那个例子替换上述两种分别会
- 报错
- 内容显示缩进

```
  是的
  是那个男人
```

### 解析模式

在解析到`heredocs`的时候，Ruby会先暂停当前行的解析，然后从下一行开始寻找直到找到相同的标识，然后完成后再继续当前行，所以可以这样写。

```ruby
puts <<~DOC, '他来了'
  是的
  是那个男人
DOC
```

这样会输出

```
是的
是那个男人
他来了
```

### 多次使用

而如果想要多次使用，则多次定义就好。

```ruby
puts <<~DOC, '他来了', <<~DOC2
  是的
  是那个男人
DOC
  那个自由的男人
DOC2
```

则会输出

```
是的
是那个男人
他来了
那个自由的男人
```

### 动态内容

默认`heredocs`相当于使用双引号定义，中间可以插入动态内容，当然也可以变成单引号杜绝这一点。

```ruby
puts <<~DOC, '他来了', <<~'DOC2'
  是的
  是那个#{'男' + '人'}
DOC
  那个自由的#{'男' + '人'}
DOC2
```

会输出

```
是的
是那个男人
他来了
那个自由的#{'男' + '人'}
```

甚至可以用[` `` `](https://ruby-doc.org/core-2.7.1/Kernel.html#method-i-60)这种方式来执行shell语法。

```ruby
puts <<~DOC, '他来了', <<~'DOC2', <<~`DOC3`
  是的
  是那个#{'男' + '人'}
DOC
  那个自由的#{'男' + '人'}
DOC2
  echo 带着他的香蕉来了
DOC3
```

输出

```
是的
是那个男人
他来了
那个自由的#{'男' + '人'}
带着他的香蕉来了
```

### 整体字符串处理

可以在一开始定义的时候加一些方法去处理对应的字符串，比如

```ruby
# 把 "男人" 替换成了 "男 人"，不得了
puts <<~DOC.gsub('男人', '男 人'), '他来了', <<~'DOC2', <<~`DOC3`
  是的
  是那个#{'男' + '人'}
DOC
  那个自由的#{'男' + '人'}
DOC2
  echo 带着他的香蕉来了
DOC3
```

输出

```
是的
是那个男 人
他来了
那个自由的#{'男' + '人'}
带着他的香蕉来了
```

## 特殊用法

在一些动态定义执行的代码的时候，可以通过`heredocs`配合`__LINE__`来达到提示行数的效果。

比如

```ruby
eval <<~CODE

  raise 'A BIG ERROR'

CODE
```

虽然会报错但是提示不到正确的报错行数。

但是如果这样写就可以达到想要的效果了。

```ruby
eval <<~CODE, binding, __FILE__, __LINE__ + 1

  raise 'A BIG ERROR'

CODE
```

输出

```
heredocs.rb:18:in `<main>': A BIG ERROR (RuntimeError)
```

这样的写法在使用[`class_eval`](https://ruby-doc.org/core-2.7.1/Module.html#method-i-class_eval)这种方法定义动态代码时非常常用。

比如像这样

```ruby
Module.class_eval <<~CODE, __FILE__, __LINE__ + 1

  raise 'CLASS ERROR'

CODE
```

这样的报错内容会准确的定位到真正执行的行数。

## 参考

- [heredocs](https://ruby-doc.org/core-2.7.1/doc/syntax/literals_rdoc.html#label-Here+Documents+-28heredocs-29)
- [相关代码](../../code/Ruby/heredocs.rb)