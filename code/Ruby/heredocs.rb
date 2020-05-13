def demo

  puts <<~DOC.gsub('男人', '男 人'), '他来了', <<~'DOC2', <<~`DOC3`
    是的
    是那个#{'男' + '人'}
  DOC
    那个自由的#{'男' + '人'}
  DOC2
    echo 带着他的香蕉来了
  DOC3

end

demo

# eval <<~CODE, binding, __FILE__, __LINE__ + 1

#   raise 'A BIG ERROR'

# CODE

Module.class_eval <<~CODE, __FILE__, __LINE__ + 1

  raise 'CLASS ERROR'

CODE