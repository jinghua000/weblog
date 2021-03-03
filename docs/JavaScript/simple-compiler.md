# simple-compiler (编译器的简单实现)

> 本文大量参考了[the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)这个项目。

## 前言

编译器在各种场合下都会有使用，从`webpack`到`babel`，到框架内部比如`vue`，都或多或少的使用到了编译，所以这次了解一下编译器的最基础的实现。

## 目标

这次就把一个`lisp-like`函数调用方式转换成JavaScript的方式。

两种语言的函数调用方式对比如下：

|             | LISP                   | JavaScript             |
| ----------- | ---------------------- | ---------------------- |
| 2 + 2       | (add 2 2)              | add(2, 2)              |
| 4 - 2       | (subtract 4 2)         | subtract(4, 2)         |
| 2 + (4 - 2) | (add 2 (subtract 4 2)) | add(2, subtract(4, 2)) |

前者大概可以描述为括号表示函数调用，参数之间用空格隔开。

我们这里假设我们的源代码是这样的

```
(add 100 (substract 3 2))
```

也就是`100 + (3 - 2)`，那么开始吧。

## 思路

一般的编译器分为以下几步：

1. *Parsing* - 将源代码文本解析成更为抽象的表达方式，通常是AST（Abstract Syntax Tree） - 抽象语法树。
2. *Transformation* - 可以通过具体需要去变更，处理原始的AST。
3. *Code Generation* - 从AST生成代码。

接下来就一步步开始。

## Parsing

这一步主要是对于源代码的解析，一般可再细分成2步：

1. *Lexical Analysis*（词法分析）- 将源代码以单词为维度分成许多独立的片段。
2. *Syntactic Analysis*（语法分析）- 把独立的代码片段以树形结构串联起来，生成AST。

### Lexical Analysis

这一步通常会用`tokenizer`表达，传入源代码，返回`tokens` - 我称之为单词数组。

对于我们的例子来说, 拆分后大概会表示成下面的样子：

```js
[
  { type: 'paren', value: '(' },
  { type: 'name', value: 'add' },
  { type: 'number', value: '100' },
  { type: 'paren', value: '(' },
  { type: 'name', value: 'substract' },
  { type: 'number', value: '3' },
  { type: 'number', value: '2' },
  { type: 'paren', value: ')' },
  { type: 'paren', value: ')' }
]
```

这一步可以理解为以单个单词为维度拆分了一句句子，类比到中文就比如

```
我去餐厅吃饭
```

就可以被拆分为

```
我，去，餐厅，吃饭
```

这种以词性区分的单词合集。

知道了其意义之后就是代码实现了，具体如下：

```js
function tokenizer(input) {
    // 单词数组
    const tokens = []

    // 设定一个指针
    let current = 0
    // 从0开始遍历源代码
    while (current < input.length) {

        let char = input[current]

        // 如果是空格则跳过
        const spaceRegExp = /\s/
        if (spaceRegExp.test(char)) {
            current++
            continue
        }

        // 如果是括号则加入结果中
        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char })

            // 指针指向下一位，开始下次循环
            current++
            continue
        }

        // 如果是小写字母（这里暂且只支持小写字母）
        // 则累计遍历到最后一个小写字母再放入结果中
        const letterRegExp = /[a-z]/
        if (letterRegExp.test(char)) {
            let value = ''

            while (letterRegExp.test(char)) {
                value += char
                char = input[++current]
            }

            tokens.push({ type: 'name', value })
            continue
        }

        // 如果是数字则累加遍历到最后一个数组放入结果中
        const numberRegExp = /[0-9]/
        if (numberRegExp.test(char)) {
            let value = ''

            while (numberRegExp.test(char)) {
                value += char
                char = input[++current]
            }

            tokens.push({ type: 'number', value })
            continue
        }

        throw new Error('词法分析失败，有不支持的单词类型')
    }

    return tokens
}
```

大致的逻辑就是设定一个指针，通过合适的规则不断的一个个向后寻找符合条件的单词。

### Syntactic Analysis

再接下来就是语法分析，把刚刚得到的单词们关联起来，把一整个语句生成一个树形结构，也就是抽象语法树。

看上去会像这样：

```json
{
  "type": "Program",
  "body": [
    {
      "type": "CallExpression",
      "name": "add",
      "params": [
        {
          "type": "NumberLiteral",
          "value": 100
        },
        {
          "type": "CallExpression",
          "name": "substract",
          "params": [
            {
              "type": "NumberLiteral",
              "value": 3
            },
            {
              "type": "NumberLiteral",
              "value": 2
            }
          ]
        }
      ]
    }
  ]
}
```

这一步就相当于把单词连成句子，用树形结构表示他们之间的关系。

比如函数就有类型，函数名，参数。这些理论上都可以自定义，根据每一种不同的语言的需要。

主要是代码的实现，因为每一个子节点都有可能是各种类型，所以用递归明显会更方便实现一些，具体代码如下。

```js
function parser(tokens) {

    // 设定一个指针，从0开始
    let current = 0

    // 这里用递归更容易实现
    function parse() {
        let token = tokens[current]

         // 如果是数字则返回数字节点，指针指向下一个
        if (token.type === 'number') {
            current++
            return {
                type: 'NumberLiteral',
                value: +token.value,
            }
        }

        // 如果是左括号
        if (token.type === 'paren' && token.value === '(') {

            // 生成一个类型为调用表达式的节点
            const node = {
                type: 'CallExpression',
                name: '',
                params: [],
            }

            // 指向下一个token，正常情况下一定是name类型的
            token = tokens[++current]
            if (token.type !== 'name') {
                throw new Error('没有提供函数名')
            }

            node.name = token.value
            // 再指向下一个token
            token = tokens[++current]

            // 只要不是右括号则一直加入参数中
            while (!(token.type === 'paren' && token.value === ')')) {
                node.params.push(parse())
                // 更新当前指针
                token = tokens[current]
            }

            // 跳过右括号
            current++

            return node
        }

        throw new Error('token类型错误')
    }

    const ast = {
        type: 'Program',
        body: [],
    }

    // 把所有的token生成的节点放入body中（如果是多行语句则会有多个对象）
    while (current < tokens.length) {
        ast.body.push(parse())
    }

    return ast
}
```

大致的思路就是`parse`函数针对特定类型的值有特定的处理方式，而有那种需要依赖其他值的语法的时候（比如参数调用，参数可能是任何内容）就递归的调用，同时维护一个指针来确立位置。

## Transformation

事实上如果我们的需求只是生成代码的话，通过上面得到的AST就可以直接进行下一步`Code Generation`了，但那样必须要针对我们自己的树形结构生成对应的JavaScript代码，实际情况下两种语法可能是不同语言的，所以更好的是将我们之前的AST转换成更标准的语法。

理所当然的，目前市面上也有比较常用的规范[estree](https://github.com/estree/estree)，比如十分常用的编译器[acorn](https://github.com/acornjs/acorn)就是符合这项标准的。（目前webpack, rollup都是基于他，@babel/parser也是参考的他）具体各种生成结果可以在 https://astexplorer.net/ 尝试。

于是我们接下来考虑把我们的AST变成符合estree规范的AST。

所以我们必须要遍历所有节点，于是我们针对每个节点都设定自己的处理函数，整体叫做`visitor`，大概是这样。

```js
const visitor = {
   Program: function (node, parent) {
      // ...
   },
   NumberLiteral: function (node, parent) {
      // ...
   },
   // ...
}
```

对于每个函数需要的参数可以根据具体需要做考量，这里为了获得最简单的关系对应暂且传入当前节点和父节点。

另外因为我们的需求比较简单，所以也不需要在意访问时间点，如果需要的话可以设定访问开始和访问结束之类的时间点比如

```js
const visitor = {
   Program: {
      enter () {
         // ...
      },
      exit () {
         // ...
      },
   }
   // ...
```

对于我们这里就不需要了，接下来实现一下具体代码。

```js
function traverser(ast, visitor) {
    // 访问单个节点
    function traverseNode (node, parent) {
        // 执行当前访问函数
        const method = visitor[node.type]
        method && method(node, parent)

        // 如果有子节点则遍历子节点
        switch(node.type) {
            case 'Program':
                traverseArray(node.body, node)
                break
            case 'CallExpression':
                traverseArray(node.params, node)
                break
            case 'NumberLiteral':
                break
            default:
                throw new Error('节点类型错误')
        }
    }

    // 访问数组节点
    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent)
        })
    }

    // 访问ast根节点
    traverseNode(ast, null)
}
```

这个函数提供了AST以及visitor，可以让我们访问到每一个节点，而对于每个节点的具体操作则要根据需要来，我们这里是希望把语法转换成符合estree标准的语法，所以再实现一个转换函数。

```js
function transform(ast) {
    const newAst = {
        type: 'Program',
        body: [],
    }

    // 这里设置一个属性指向新的AST上下文
    ast._context = newAst.body
    traverser(ast, {
        NumberLiteral(node, parent) {
            // 转换为estree标准的数字节点，放入父节点上下文
            parent._context.push({
                type: 'Literal',
                value: node.value,
            })
        },
        CallExpression(node, parent) {
            // estree标准的调用节点结构
            let expression = {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: node.name,
                },
                arguments: [],
            }

            // 把上下文设置为参数数组
            node._context = expression.arguments

            // 如果父节点不是调用表达式则表达式外层需要套一层，estree标准
            if (parent.type !== 'CallExpression') {
                expression = {
                    type: 'ExpressionStatement',
                    expression,
                }
            }

            // 当前表达式放入父节点上下文中
            parent._context.push(expression)
        },
    })

    return newAst
}
```

这个函数的内部实现事实上是完全根据需要来的，因为我们需要这里转换格式所以生成了一个新的AST，再判断节点，把对应节点转换过的新格式放入新的树中。

这样之后我们得到的结果是这样：

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "Identifier",
          "name": "add"
        },
        "arguments": [
          {
            "type": "Literal",
            "value": 100
          },
          {
            "type": "CallExpression",
            "callee": {
              "type": "Identifier",
              "name": "substract"
            },
            "arguments": [
              {
                "type": "Literal",
                "value": 3
              },
              {
                "type": "Literal",
                "value": 2
              }
            ]
          }
        ]
      }
    }
  ]
}
```

目前这个树结构是符合estree标准的，以至于我们可以使用其他第三方库来操作这个树。比如[escodegen](https://github.com/estools/escodegen)，可以通过estree生成代码，对上面这个树结构的执行结果是：

```js
add(100, substract(3, 2));
```

## Code Generation

虽然上面已经可以用其他库实现了，不过我们这里还是来了解一下通过AST生成代码的原理吧。大概的原理实际很简单，就是判断当前节点的类型对其以及其子节点递归的去生成代码。

```js
function generateCode(node) {
    switch(node.type) {
        case 'Program':
            // 对body每一个节点生成代码用换行隔开
            return node.body.map(generateCode).join('\n')
        case 'Literal':
            // 字面量直接返回值
            return node.value
        case 'ExpressionStatement':
            // 表达式则返回表达式生成的代码，加上分号结尾
            return generateCode(node.expression) + ';'
        case 'CallExpression':    
            // 如果是函数调用，则把参数生成的代码通过逗号隔开
            return `${node.callee.name}(${node.arguments.map(generateCode).join(', ')})`
        default:
            throw new Error('节点类型错误')
    }
}
```

把上面几步加起来大概会是下面这样：

```js
const tokens = tokenizer(code)
const ast = parser(tokens)
const newAst = transform(ast)
const result = generateCode(newAst)
console.log(result)
// => add(100, substract(3, 2));
```

那么这样就完成了。

## 总结

这次介绍了编译器大致的工作原理，在各种场景下使用时样子可能不太一样不过核心思想就是这么几步，之后面对各种实际情况积极的去改进吧！

## 参考

- [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
- [相关代码](../../code/JavaScript/simple-compiler/index.js)