---
title: 基于完全二叉树最小堆重力索引池
pubDatetime: 2026-03-05T00:00:00+08:00
category: ""
order: 0
tags:
  - 排序
  - 性能敏感
  - 二叉树
description: 在 ECS 场景下，基于完全二叉树最小堆实现的重力索引池设计，兼顾内存紧凑与堆合法性修复。
---

## 序

在ECS的情景下，对于 Entities 的生成与回收会对性能产生巨大的波动。  
对象池的设计是正是解决此类问题的优解。  
但是对于传统的对象池，在大量存取之后，其内存分布将会变得无序且极度分散，但是在高性能，或高并发的场景下需要尽可能的使得物理内存聚集连续  
故有此篇。

## 设计理念

基于最小堆算法实现，如果读者对这个技术十分了解，则本篇已无继续阅读的必要。  
由于Unity的限制，本篇依旧使用C#设计。

合法堆要求

- 数据结构为完全二叉树。
- 完全二叉树中父节点必须小于或者等于其左右子节点。

### 容器设计 - NativeList

我们需要一个容器类来存放暂时不用的数据。这个容器应该符合先进先出的原则，并且能够灵活的操作。
在这个场景下 NativeList 是较为贴合需求的选择。
在 NativeList 中，我们只要按顺序 Add 和 RemoveAt(last)，就可以保证整体的结构是一个标准的完全二叉树结构。  
同时也能够自由的操作容器中的数据。
注意，由于使用的 NativeList ，所以类型只能够是值类型。

### NativeList 中的性能深坑

如果读者有过性能方面的了解，想必知道 List 与 数组 下移除首位的性能开销。  
NativeList 虽然也是 List ，但是由于为了保持内存连续的结构，在破坏结构后需要进行排序对齐。  
如果我们移除了NativeList中的首位，则需要对后续的所有位排序。

> 在连续内存中，移除首位都是极其昂贵的操作。

### 二叉树探针

在一个标准的完全二叉树结构中，使用如下方式可以获得任意Index节点的两个子节点或者是父节点。

```
    // 获取节点的两个子节点
    int leftChild = (parentIdx << 1) + 1;
    int rightChild = (parentIdx << 1) + 2;
    // 获取节点的父节点
    int parentIdx = (childIdx - 1) >> 1;
```

但是要注意判空，有可能右节点是不存在的。

## 代码实现

### 出池队尾填充

在需求上我们需要拿到头部数据的同时，也不想支付昂贵的排序开销操作。

```
    int minIndex = _freeHeap[0];
    int lastIdx = _freeHeap.Length - 1;

    _freeHeap[0] = _freeHeap[lastIdx];
    _freeHeap.RemoveAt(lastIdx);
```

我们拿出了首位的数据，同时将队尾的数据写入首位中，然后将队尾的数据弹出。  
这样我们就避免了因为移除首位导致的内存断层，进而避免了触发 NativeList 的排序。  
同时，我们也破坏了上述的合法堆的结构要求，整个堆变成了非法堆。  
但是问题变得更好解决，对于 CPU 而言，完全二叉树排序是一个非常简单又轻松的工作。  
我们的问题从 连续内存断层后的数据移动 变为了 将错乱的完全二叉树合法化 。  
具体的实现我们在下文中探讨。

### "重力索引" - 修复破碎的非法堆

上文的操作中，我们已经知道，当前堆物理上是紧凑的，但是逻辑上是非法的。  
在出池的修复逻辑下，问题的关键在于寻找子节点中的小值是否合法，即大于或等于父节点。

```
  while (true)
  {
      int leftChild = (parentIdx << 1) + 1;
      int rightChild = (parentIdx << 1) + 2;
      if (leftChild >= _freeHeap.Length) break;
      //判断是否有右节点，并且右节点小于左节点。获取最小的子节点。
      int smallestChild = (rightChild < _freeHeap.Length && _freeHeap[rightChild] < _freeHeap[leftChild])
                          ? rightChild : leftChild;

      if (_freeHeap[parentIdx] <= _freeHeap[smallestChild]) break;

      int temp = _freeHeap[parentIdx];
      _freeHeap[parentIdx] = _freeHeap[smallestChild];
      _freeHeap[smallestChild] = temp;
      parentIdx = smallestChild;
  }
```

数学复杂度公式 (The Computational Bound)  
对于一个拥有 $N$ 个元素的完全二叉树：

- 最大交换次数 ($H$)：$\lfloor \log_2(N) \rfloor$
- 对于 $N = 1024$：
  - 树的高度为 10 层。
  - 每层工作量：需要进行 2 次比较（子节点互比、父节点与最小子节点比）和 1 次交换。
  - 结论：即使最极端的最大索引，最多也只需要 20 次比较 和 10次交换。

---

入池的逻辑与出池基本类似，将数据加入队尾，同时通过算法恢复堆的合法结构。

```
    _freeHeap.Add(index);
    int childIdx = _freeHeap.Length - 1;

    while (childIdx > 0)
    {
        int parentIdx = (childIdx - 1) >> 1;
        if (_freeHeap[childIdx] >= _freeHeap[parentIdx]) break;

        // 交换：小的索引向上浮动
        int temp = _freeHeap[childIdx];
        _freeHeap[childIdx] = _freeHeap[parentIdx];
        _freeHeap[parentIdx] = temp;
        childIdx = parentIdx;
    }
```

数学复杂度公式 (The Computational Bound)  
对于一个拥有 $N$ 个元素的完全二叉树：

- 最大交换次数 ($H$)：$\lceil \log_2(N + 1) \rceil - 1$
- 对于 $N = 1024$：
  - $2^{10} = 1024$，所以最大高度约为 10 层。
  - 结论：即使归还的是最末尾的一个最小索引，它最多也只需要 10 次 比较和 10 次 交换就能到达堆顶。

## 总结

以上，无论我们在出池或者入池时，都保障了堆的合法性。  
不仅获取了头部数据，也避免了因为连续内存断层导致的庞大的性能开销。  
至于初始化部分和运行时逻辑健壮性在此不过多讨论，依据具体需求实现即可。

## 尾记

至于为什么命名”重力索引“？我们以出池为例。  
如果读者尝试推导这个计算过程就不难发现，这个算法的流程其实就是将末尾的数值放在二叉树顶部，然后逐步将其”踢回“属于它的位置。  
就像一个石头从山峰上滚下去。
