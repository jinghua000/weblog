# simple-interpreter (解释器的简单实现)

## 前言

这次来尝试使用JS解析执行JS吧。虽然看上去没什么用但是能够对代码的执行更加清晰也不免是一件好事。

真要说的话可能在一些"小程序"之类的场景有用处，另外则是能够将这个思路套用到其他地方，比如某种情况下自定义一种语法然后使用JS执行。

不要需要注意的是`解释器`和`编译器`在很多地方是相通的，所以有部分重复的概念则不会讲的那么细致，具体可以参考前一篇文章[编译器的简单实现](./simple-compiler.md)。

## 思路

大致的思路就是，在我们这样那样的成功解析了语法，生成了AST之后（这部分在编译器里）。然后就对每个AST的节点进行求值计算。举个例子，比如假设我们有下面这么一种语法：

```js
{
    type: 'BinaryExpression',
    operator: '+',
    left: {
        type: 'Number',
        value: 1
    },
    right: {
        type: 'Number',
        value: 2
    },
}
```

无论这是什么语言，我们可以推断出他想表达的是一个`1 + 2`的二元表达式。则我们需要用某一个方法去计算出他，而参数就是这个节点信息。大致看上去是这样：

```js
// 传入节点信息
function calc(node) {
    // 在此处计算结果...
}
```

尝试实现一下，代码可以这么写：

```js
function calc(node) {
    if (node.type === 'BinaryExpression' && node.operator === '+') {
        return calc(node.left) + calc(node.right)
    }

    if (node.type === 'Number') {
        return node.value
    }
}
```

这看上去很简单，但此时有同学就要问了 —— 为什么你要递归的调用节点取值，你不能直接用两层判断如果类型是`Number`就把`node.value`写进去吗？

那是因为真实的代码可能是各种奇形的怪状，比如会是这样`1 + (2 + 3)`或者`1 * (2 - 5)`这样。所以有这样一个结论：

**每个节点的子节点可能是任何节点**

比如二元表达式的左节点可能也是一个二元表达式，所以当你不确定接下来的节点的情况下，一种方法就是总是重新传入整个节点进行判断。如果之前有了解过编译器的话会发现这个思路很像。

## 实现

好了，了解了最基本的理念，先从最简单的开始吧，我们把上面的`1 + 2`当做JS代码来进行解释吧！

幸运的是我们不需要自己去生成AST，我们可以用现有的库，比如[acorn](https://github.com/acornjs/acorn)来帮助我们实现（当然如果想要自己实现可以看之前编译器的文章），另外我们选择使用`typescript`，主要是因为有`@types/estree`的类型推导能够给开发带来许多便捷。

项目主要结构大概是这样子的：

- src
  - visitor.ts - 定义对于节点的访问函数
  - interpreter.ts - 暴露主要方法

好吧，其实这就够了，我们首先进入`interpreter`，对外暴露一个`run`方法。

```ts
// interpreter.ts

import { parse } from 'acorn'
import { Node } from 'estree'
import { visit } from './visitor'

export function run(code: string) {
    const ast = parse(code, {
        ecmaVersion: 2020
    })

    return visit(ast as Node)
}
```

事实上就是转AST之后传入一个访问节点的函数中，那么接下来我们看`visit`的实现。

```ts
// visitor.ts
import * as ES from 'estree'

// ...

export function visit(node: ES.Node) {
    const method = Visitor[node.type]

    if (!method) {
        throw new Error(`type "${node.type}" is not supported`)
    }

    return method(node)
}
```

这也非常的耿直，判断一下如果对应的节点类型的方法不存在则报错，否则就调用对应函数，于是开始真正重要的看`Visitor`对象提供了哪些内容吧。

接下来就和JS的`estree`结构相关了，首先毫无疑问的是`Program`类型。

```ts
const Visitor = {
    Program(node: ES.Program) {
        let result: any
        node.body.forEach(child => {
            result = visit(child)
        })
        return result
    },
    // ...
```

根据`estree`的结构，`Program`节点的`body`属性是一个数组，每一个元素就是一句语句，我们把最后一句语句当做返回值，也方便我们调试。

另外此时`typescript`的好处也显现出来了，可以帮我们联想出节点上的属性。而对于我们的要求计算`1 + 1`，我们还需要以下几种节点。

```ts
// ...

    // 表达式
    ExpressionStatement(node: ES.ExpressionStatement) {
        return visit(node.expression)
    },
    // 二元表达式
    BinaryExpression(node: ES.BinaryExpression) {
        return BinaryVisitor[node.operator](
            visit(node.left), 
            visit(node.right)
        )
    },
    // 字面量
    Literal(node: ES.Literal) {
        return node.value
    },

// ...
```

可以看到，基本每一个对应节点的执行函数都会不断的去调用`visit`，事实上从外层看就是`visit`的递归，然后再对于每一种不同类型的节点结构进行分别处理。可能你注意到上面我们又引入了一个`BinaryVisitor`对象，事实上这个只是把二元表达式的方法提取出来而已，大概是这样：

```ts
export const BinaryVisitor = {
    '+': (l: any, r: any ) => l + r,
    '-': (l: any, r: any ) => l - r,
    '*': (l: any, r: any ) => l * r,
    '/': (l: any, r: any ) => l / r,
    // ...
```

好了，迄今为止我们事实上已经实现了解释简单的加减乘除了，来测试一下，这里我使用了[jest](https://jestjs.io/)进行测试。

```js
import { run } from '../src'

it('1 + 2 = 3', () => {
    expect(run('1 + 2')).toBe(3)
})
```

结果当然毫无问题，可喜可贺，我们完成了解释器，真不错。

## 进阶

现在你已经学会了如何使用解释器来解释JS，来尝试解释一下下面这段代码吧。

```js
function fib(n) {
    if (n < 2) return n 

    return fib(n - 1) + fib(n - 2)
}

fib(10)
```

哦，我知道这个，这是斐波那契数列，还特意用了复杂度特别高的递归写法，我们尝试用刚刚的解释器解释他。

（稍作观察）—— What the f***! 这根本不是一回事！

没错，我们刚刚的实现忽略了JS中非常重要的两个概念 —— 作用域，调用栈，这次我们尝试一下实现一下他们吧。

### 作用域

我们都知道，JS的作用域是一层一层叠加的，如果我的作用域没有某个变量，则需要去父级寻找，根据这个理念我们可以先定义一个`Scope`类。

- src
  - visitor.ts
  - interpreter.ts
  - scope.ts - 作用域
  - shared.ts - 公共方法

```ts
// scope.ts

import { ref, Ref } from './shared'

export class Scope {
    parent: Scope
    store: Map<string, Ref>

    constructor(parent?: Scope) {
        // 如果不存在父作用域则创建一个全局作用域
        this.parent = parent || createGlobalScope()
        this.store = new Map()
    }

    get(name: string): Ref {
        // 如果当前的存储空间不存在某个值则去父级找
        if (this.store.has(name)) {
            return this.store.get(name)
        } else {
            return this.parent.get(name)
        }
    }

    // ...
```

上面有两个没有说明过的内容，`Ref`以及`createGlobalScope`，一个个来看。

`Ref`主要是为了去包装一层原始数据，因为除了数据的值以外可能还会有其他附加属性，接口是这样：

```ts
// shared.ts

export type Kind = 'var' | 'let' | 'const'

export interface Ref {
    value: any
    kind: Kind
}

export function ref(value: any, kind: Kind): Ref {
    return { value, kind }
}
```

除了`value`以外我们还设置了一个变量声明的类型，根据解释器的复杂程度，可能需要的属性更多。

而`createGlobalScope`这个就很好理解了，创建一个全局作用域，可以这样实现：

```ts
function createGlobalScope() {
    return {
        get(name: string): Ref {
            if (name in globalThis) {
                return ref(globalThis[name], 'let')
            } else {
                throw new ReferenceError(`${name} is not defined`)
            }
        }
    } as Scope
}
```

这里我们直接使用了`globalThis`认为是全局作用域，并假设变量是通过`let`定义的，当然根据你的需要可以自己设定一个额外的自定义作用域用来调用自定义代码。

接下来就是对于变量定义的实现，在JS里有`var`，`let`，和`const`可以定义，因为`var`本身现在也比较少用实现起来还比较麻烦就忽略他了，另外函数定义我们也用`const`去代替，否则还会面对一个叫变量提升的问题，会很麻烦。

```ts
// class Scope
// ... 

    $var() {
        throw new Error(`"var" declaration is not supported`)
    }
    
    $let(name: string, value?: any) {
        this._check(name)
        this.store.set(name, ref(value, 'let'))
    }

    $const(name: string, value: any) {
        this._check(name)
        this.store.set(name, ref(value, 'const'))
    }

    _check(name: string) {
        if (this.store.has(name)) {
            throw new SyntaxError(`${name} has already been declared`)
        }
    }

// ...
```

基本就是首先检查是否当前作用域是否存在，如果存在则报错，不存在则设置，`const`一定需要初始值，而`let`可以没有。

之后再加上对应node的处理函数即可

—— 话是这么说但是聪明的同学已经发现了，我们的`visit`函数里根本没有办法取得作用域，所以需要我们改造一下`visit`函数。

```diff
- export function visit(node: ES.Node) {
+ export function visit(node: ES.Node, scope: Scope) {
    const method = Visitor[node.type]

    if (!method) {
        throw new Error(`type "${node.type}" is not supported`)
    }

-    return method(node)
+    return method(node, scope)
}
```

如上所述，我们需要把作用域作为参数传递进去，并且对于每个节点的执行函数基本都要加上第二个参数。比如下面这样：

```diff
-    ExpressionStatement(node: ES.ExpressionStatement) {
+    ExpressionStatement(node: ES.ExpressionStatement, scope: Scope) {
-        return visit(node.expression)
+        return visit(node.expression, scope)
    },
```

就不一一展示了，然后就可以加上我们定义变量的执行函数了。

```ts
// ...

    // 变量定义
    VariableDeclaration(node: ES.VariableDeclaration, scope: Scope) {
        // 设定全局声明类型
        state.kind = node.kind
        node.declarations.forEach(child => visit(child, scope))
    },
    VariableDeclarator(node: ES.VariableDeclarator, scope: Scope) {
        // 只支持最普通的声明
        if (node.id.type === 'Identifier') {
            const name = node.id.name
            const init = node.init

            if (state.kind === 'let') {

                if (init) {
                    scope.$let(name, visit(init, scope))
                } else {
                    scope.$let(name)
                }

            } else if (state.kind === 'const') {
                // const定义一定有初始值，否则在之前的编译阶段会语法错误
                scope.$const(name, visit(init, scope))
            } else if (state.kind === 'var') {
                // 这里会抛出异常
                scope.$var()
            }
        } else {
            throw new Error(`type "${node.id.type}" declaration is not supported`)
        }
    },
    // 取得声明的变量
    Identifier(node: ES.Identifier, scope: Scope) {
        return scope.get(node.name).value
    },

// ...
```

从上面的代码我们可以看到有些状态不方便通过参数传递于是我们设定了一个全局状态`state.kind`，因为JS是单线程运行所以理论上这个全局状态不会有问题，类似的操作等会还会进行。

然而上面的只是声明，如果并非初始化要重新赋值类似`let a; a = 123`的语句则还需要解析赋值表达式。

```ts
// ...

    // 赋值表达式
    AssignmentExpression(node: ES.AssignmentExpression, scope: Scope) {
        let variable: Ref
        // 只支持最简单的赋值
        if (node.left.type === 'Identifier') {
            variable = scope.get(node.left.name)

            // 如果是const声明则不能重新赋值
            if (variable.kind === 'const') {
               throw new TypeError('Assignment to constant variable')
            }
        } else {
            throw new Error(`type "${node.left.type}" assignment is not supported`)
        }

        // AssignVisitor 拥有许多类似 '=': (l: Ref, r: any) => l.value = r 的函数
        return AssignVisitor[node.operator](
            variable,
            visit(node.right, scope)
        )
    },

// ...
```

好了，这样之后我们已经普通的声明变量了，但这和我们的目标还相差有点远，接下来我们就开始下一步对函数的处理。

### 声明函数

首先我们写一个针对函数节点的执行函数。

```ts
// ...

    FunctionDeclaration(node: ES.FunctionDeclaration, scope: Scope) {
        // 使用const进行定义
        scope.$const(node.id.name, createFunction(node, scope))
    },

// ...
```

好了，重要的点就在`createFunction`这个方法里，我们来实现这个方法。

首先明确一个JS中函数的特性：

**函数的作用域在定义时生成的，函数体是在调用时执行的**

于是对于`createFunction`这个方法，我们要做的是：

1. 返回一个函数，并且以下几步全在函数体内
2. 以当前作用域为父级，生成一个新的作用域
3. 遍历所有参数，在新的作用域内以`let`方式进行声明
4. 声明`this`，`arguments`等固定值（这一步因为我们的例子没有用到，暂且忽略，原理类似）
5. 解释执行函数体

理解了以上几步，代码可以实现如下：

```ts
function createFunction(node: ES.BaseFunction, scope: Scope) {
    return function (...args: any) {
        const { params, body } = node
        // 新建作用域
        const newScope = new Scope(scope)

        params.forEach((param, index) => {
            // 只支持普通的参数传递
            if (param.type === 'Identifier') {
                newScope.$let(param.name, args[index])
            } else {
                throw new Error(`type "${param.type}" params is not supported`)
            }
        })

        // 执行函数体
        return visit(body, newScope)
    }   
}
```

好了，这样一来我们已经声明好函数了，接下来则是调用函数，不过在那之前，我们先处理一个判断逻辑吧，因为我们的例子里也用到了`if`判断。

### 判断

```ts
// ...

    IfStatement(node: ES.IfStatement, scope: Scope) {
        const condition = visit(node.test, scope)
        const { consequent, alternate } = node

        if (condition) {
            return visit(
                consequent, 
                consequent.type === 'BlockStatement' 
                    ? new Scope(scope)
                    : scope
            )
        } else if (alternate) {
            return visit(
                alternate, 
                alternate.type === 'BlockStatement' 
                    ? new Scope(scope)
                    : scope
            )
        }
    },
    BlockStatement(node: ES.BlockStatement, scope: Scope) {
        let result: any
        const { body } = node
        for (let i = 0; i < body.length; i++) {
            result = visit(body[i], scope)
        }

        return result
    },

// ...
```

在实现了之前的一些逻辑之后，解释判断条件对我们来说还是挺简单的，只需要按部就班的根据节点格式处理逻辑即可。需要注意的是在`if () {}`语句中是存在块级作用域的，而面对块级作用域我们需要新建一个作用域去执行他。

### 执行函数

好了，那么回到函数上来，现在我们有了判断，距离我们的目标只差一步了，也就是函数调用。我们先尝试实现一下十分容易想到的逻辑。

```ts
// ...

    CallExpression(node: ES.CallExpression, scope: Scope) {
        const { callee } = node
        let result: any

        // 只支持普通调用
        if (callee.type === 'Identifier') {
            const name = callee.name
            // 取得传递的参数的值
            const params = node.arguments.map(param => visit(param, scope))
            result = scope.get(name).value(...params)
        } else {
            throw new Error(`type "${callee.type}" callee is not supported`)
        }

        return result
    },
    ReturnStatement(node: ES.ReturnStatement, scope: Scope) {
        return visit(node.argument, scope)
    },

// ...
```

看上去也没什么特别的，函数调用是取得参数的定义值，然后一股脑的传递给函数就可以了，看上去大功告成了吗。

然而稍微试一下就会发现问题，这种写法根本不支持`return`嘛，就算`return`了后续的代码还是会继续执行。并且对于JS的AST格式来说，函数体的Node类型也是`BlockStatement`，所以我们必须要在块级作用域的执行函数中判断出当前执行的是否是函数。

这里我们就要引入另一个概念了 —— 调用栈。

JS是单线程的，一共只有一个调用栈，所以我们完全可以声明一个全局的栈当做调用栈，如下：

```ts
export const callstack: CallStack = {
    // 栈内容
    stack: [],
    // 入栈
    push(obj: FunctionObject) {
        this.stack.push(obj)
    },
    // 出栈
    pop() {
        this.stack.pop()
    },
    // 获得当前执行中的函数状态
    get current() {
        return this.stack[this.stack.length - 1]
    }
}
```

而对于`FunctionObject`来说，我们暂时只要定义一个属性就可以了，也就是确认是否`return`。

```ts
interface FunctionObject {
    return?: boolean
}
```

然后在函数调用时，我们则要做对应的处理：

```diff
// ...

    CallExpression(node: ES.CallExpression, scope: Scope) {
        const { callee } = node
        let result: any

        if (callee.type === 'Identifier') {
            const name = callee.name
            const params = node.arguments.map(param => visit(param, scope))
+            callstack.push({})
            result = scope.get(name).value(...params)
+            callstack.pop()
        } else {
            throw new Error(`type "${callee.type}" callee is not supported`)
        }

        return result
    },

// ...
```

在函数调用前入栈，调用后出栈，这样在任何情况下我们就可以获得当前函数的状态了，然后在`BlockStatement`执行函数中做以下修改：

```diff
// ...

    BlockStatement(node: ES.BlockStatement, scope: Scope) {
        let result: any
        const { body } = node
        for (let i = 0; i < body.length; i++) {
            result = visit(body[i], scope)

+            if (callstack.current && callstack.current.return) {
+                return result
+            }
        }

+        if (!callstack.current) {
            return result
+        }
    },

// ...
```

好的，这样一来我们就实现了`return`的效果，看上去总体已经完成了。

让我们来尝试一下一开始的例子：

```ts
it('Fib sequence!', () => {
    expect(run(
        `
            function fib(n) {
                if (n < 2) return n 

                return fib(n - 1) + fib(n - 2)
            }

            fib(10)
        `
    )).toBe(55)
})
```

结果当然是顺利完成了！Excited！如果是在debugger模式下，就可以看到代码是如何一步步执行的了，十分有意思。

## 总结

这次尝试实现了一个简单的解释器，说到底这个东西的思路比起实现可能更加要重要，好好弄清楚代码的执行方式也许能在其他地方有特殊用处，完整的代码在[这里](https://github.com/jinghua000/demo-interpreter)。

## 参考
- [「 giao-js 」用js写一个js解释器](https://juejin.cn/post/6898093501376905230)
- [jsjs](https://github.com/bramblex/jsjs)
- [canjs](https://github.com/jrainlau/canjs)
- [项目代码](https://github.com/jinghua000/demo-interpreter)
