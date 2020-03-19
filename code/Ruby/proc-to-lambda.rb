def convert_proc_to_lambda(source_proc)
  return source_proc if source_proc.lambda?

  unbound_method = Module.new.module_eval do
    instance_method(define_method(:_, &source_proc))
  end

  lambda do |*args, &block|
    unbound_method.bind(self).call(*args, &block)
  end
end

def call_block(*args, &block)
  convert_proc_to_lambda(block).call(*args)
  # block.call(*args)
end

def calc1
  num1 = call_block(1) do |x|
    return x
  end

  num2 = 1

  num1 + num2
end

puts calc1

def calc2
  num1 = lambda do |x|
    return x
  end.call(1)

  num2 = 1

  num1 + num2
end

puts calc2

class AA; def demo; 123; end; end;
class BB; def demo; 234; end; end;

demo_proc = proc { demo }
puts(AA.new.instance_exec &demo_proc) # => 123
puts(BB.new.instance_exec &demo_proc) # => 234

lambda_demo_proc = convert_proc_to_lambda(demo_proc)
puts lambda_demo_proc.lambda? # => true
puts(AA.new.instance_exec &lambda_demo_proc) # => 123
puts(BB.new.instance_exec &lambda_demo_proc) # => 234