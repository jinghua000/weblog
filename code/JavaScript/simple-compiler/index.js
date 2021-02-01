const escodegen = require('escodegen')
const code = `(add 100 (substract 3 2))`

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

const tokens = tokenizer(code)
console.log(tokens)
const ast = parser(tokens)
console.log(JSON.stringify(ast, null, 2))
const newAst = transform(ast)
console.log(JSON.stringify(newAst, null, 2))
// const result = escodegen.generate(newAst)
const result = generateCode(newAst)
console.log(result)