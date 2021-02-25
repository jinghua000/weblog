class VritualList {

    constructor(container, options = {}) {
        // 原始容器
        this.container = container
        // 列表数据 NODE节点数组
        this.data = options.data
        // 最大加载数量
        this.maxCount = options.maxCount
        // 最条数据的高度
        this.itemHeight = options.itemHeight

        this.init()
    }

    init() {
        // 容器高度
        this.containerHeight = this.container.clientHeight
        // 总数据
        this.total = this.data.length
        // 已加载的第一个index
        this.start = 0
        // 已加载的最后一个index
        this.end = 0
        // 目前滚动条位置
        this.scrollTop = 0
        // 上次滚动条位置
        this.oscrollTop = 0
        // 预留数量 
        this.reserveCount = this.getReserveCount()
        // 包装用div
        this.wrapperNode = this.createWrapper()
        // 滚动用div
        this.scrollBarNode = this.createScrollBar()
        // 展示列表用div
        this.scrollListNode = this.createScrollList()

        this.wrapperNode.onscroll = this.handleScroll.bind(this)
        this.wrapperNode.append(this.scrollBarNode, this.scrollListNode)
        this.container.append(this.wrapperNode)

        this.end = this.start + this.maxCount
        this.scrollListNode.append(...this.data.slice(this.start, this.end))
    }

    get current() {
        return Math.floor(this.scrollTop / this.itemHeight)
    }

    handleScroll() {
        this.scrollTop = this.wrapperNode.scrollTop
        if (this.scrollTop > this.oscrollTop) {
            this.scrollNext()
        } else {
            this.scrollPrev()
        }

        this.oscrollTop = this.scrollTop
        this.scrollListNode.style.transform = `translateY(${this.start * this.itemHeight}px)`
    }

    scrollNext() {
        const listNode = this.scrollListNode
        while (this.current - this.start > this.reserveCount) {
            this.start++
            listNode.firstChild.remove()
    
            if (this.end < this.total) {
                listNode.append(this.data[this.end++])
            }
        }
    }

    scrollPrev() {
        const listNode = this.scrollListNode
        while (this.start && this.current - this.start < this.reserveCount) {
            listNode.prepend(this.data[--this.start])
    
            if (this.end - this.start >= this.maxCount) {
                this.end--
                listNode.lastChild.remove()
            }
        }
    }

    // 预留数量 相当于current - start的最大数量
    getReserveCount() {
        const oneScreenShow = Math.floor(this.containerHeight / this.itemHeight)
        // (总体显示的数量 - 一个屏幕最多显示的数量) 的一半
        return Math.floor((this.maxCount - oneScreenShow) / 2)
    }

    createWrapper() {
        const node = document.createElement('div')
    
        node.style.width = '100%'
        node.style.height = '100%'
        node.style.position = 'relative'
        node.style.overflow = 'auto'
    
        return node 
    }

    createScrollBar() {
        const node = document.createElement('div')
    
        node.style.height = this.total * this.itemHeight + 'px'
    
        return node 
    }

    createScrollList() {
        const node = document.createElement('div')
    
        node.style.position = 'absolute'
        node.style.left = 0
        node.style.top = 0
        node.style.width = '100%'
    
        return node 
    }

}