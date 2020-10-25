# cursors-of-linked-list (链表中双指针的运用)

## 是什么

在[链表](https://leetcode-cn.com/tag/linked-list/)中，双指针有一些不得了的用处，这次来稍微介绍一下他们。

## 题目1: 删除链表的倒数第N个节点

给定一个链表，删除链表的倒数第 n 个节点，并且返回链表的头结点。

```
给定一个链表: 1->2->3->4->5, 和 n = 2.

当删除了倒数第二个节点后，链表变为 1->2->3->5.
```

**思路**

我们都知道单向链表是没有办法知道上一个节点是什么的，所以要去思考尽可能简单的能获得节点间先后顺序的方法。一个思路是把所有链表的节点放到一个数组里，然后通过数组的下标取得倒数第n个节点然后进行删除。

这当然可以，时间复杂度是`O(n)`，空间复杂度也是`O(n)`。

但我们可以采取一种更加灵活的方式，就是设定两个指针。

具体算法如下：

1. 设定两个指针指向头部。
2. 将其中一个指正向前走`n`步。
3. 然后两个一起往前走，直到第一个指针指向空，此时第二个指针指向的地方就是倒数第`n`个节点，删除他即可。

这个行为类比到现实中的话，假设两个人的跑步速度一样，那么在开始阶段相隔`x`米，然后一起开始跑，等其中一个人到达终点的时候，另外一个人和终点的距离就是`x`米。

这样看上去就更轻松的解决这个问题了，代码如下。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
var removeNthFromEnd = function(head, n) {
    if (!head) { return head }

    // 设定两个指针
    let slow = head
    let fast = head

    // 让快指针先往前走n步
    while (n-- > 0) {
        fast = fast.next
    }

    // 假设快指针已经走到头了说明删除的是第一个节点，直接返回head.next
    if (!fast) return head.next

    // 两个指针一起走 直到快指针走到最后一个
    while (fast.next) {
        slow = slow.next
        fast = fast.next
    }

    // 此时的慢指针的next节点，正是需要删除的节点
    slow.next = slow.next.next
    return head
};
```

这个算法的的时间复杂度为`O(n)`，空间复杂度为`O(1)`。

## 题目2：环形链表

给定一个链表，判断链表中是否有环。

> 即为其中某个节点的指针指向了链表中的之前的节点，导致整个链表形成一个环。

一个环形链表大概是这种感觉。

```
1 -> 2 -> 3 -> 4
          ↑    ↓
          6 <- 5
```

**思路**

好了，拿到这个题目一开始的思路是怎样呢，没错，因为链表中的某个节点指向了之前的节点，所以只要把之前走过的路径储存下来就可以了，然后判断新的节点的指向是否在之前储存的节点中。这种算法的时间和空间复杂度都是`O(n)`。

这样当然可以，但是这里要采取一个更加有趣的方式。

> 假象一下，两个人在一个圆形操场上跑步，其中一个人跑的比另外一个人快，那么最终会形成一种什么情况。

没错，跑的快的人最终会绕过操场一圈后追上跑的慢的人，即为套圈，而这一现象在环形的轨道中是一定会出现的。

而对于这道题目来说，就可以采取类似的思路，具体算法如下：

1. 设定两个指针指向头部，一个每次走一步，一个每次走两步。
2. 那么如果是环形的链表，那么每次走两步的一定会和每次走一步的指针再次相交。
3. 如果不是环形链表，那么快指针会先走到头。

代码如下。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */
/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function(head) {
    let slow = head
    let fast = head

    while (fast) {
        // 如果快指针走到头了，则说明不是环形
        if (!fast.next) {
            return false
        }

        // 慢指针走一步，快指针走两步。
        fast = fast.next.next
        slow = slow.next

        // 如果是环形，快指针会追上慢指针。
        if (slow === fast) {
            return true
        }
    }

    return false
};
```

好了，这个方法第一次看到的时候感觉还是比较炫酷的。类似的运用比如说判断一个链表的中心点，也可以使用快慢指针，快指针走到最后的时候慢指针则在中心的位置。

这个算法的时间复杂度为`O(n)`，空间复杂度为`O(1)`。

## 附加：反转链表

这道题目虽然不是双指针但是对于指针的运用比较有特点也拿出来讲一下。

反转一个单链表。

```
输入: 1->2->3->4->5->NULL
输出: 5->4->3->2->1->NULL
```

**思考**

算法很简单，就是在正向走的时候记录上一个指针位置，每次把当前的指针位置指向上一个，储存好了再改回来。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var reverseList = function(head) {
    let prev = null

    while (head) {
        // 先保存下一个指针
        let next = head.next
        // 把当前节点的next指针指向上一个
        head.next = prev
        // 储存当前节点
        prev = head
        // 指针走向下一个
        head = next
    }
    
    return prev
};
```

虽然单向链表不方便获得上一个指针的位置，不过可以在运行途中储存，比起获得全部节点之后再依次向前指要好的多。

## 总结

指针因为只是对于内存地址的引用，只占用常数的空间，在链表中双指针的用法一般是为了降低空间复杂度。

## 参考

- [题目1](https://leetcode-cn.com/problems/remove-nth-node-from-end-of-list/)
- [题目2](https://leetcode-cn.com/problems/linked-list-cycle/)
- [附加](https://leetcode-cn.com/problems/reverse-linked-list/)