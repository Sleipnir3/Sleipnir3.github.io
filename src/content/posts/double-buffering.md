---
title: 基于Unity引擎的双缓冲机制与跨帧同步的理论
pubDatetime: 2026-03-10T00:00:00+08:00
tags:
  - Unity
  - 并行
  - JobSystem
description: 双缓冲读写分离设计在串行与并行架构下的理论分析，以及基于 Job System 的任务重叠机制。
---

## 前导

通俗的来说：  
Unity架构下调用CPU完成数个特定串行函数的工作，被称为帧。  
完成这一帧的耗时称之为帧时间。  
最终我们所说的帧率就是限定的时间内（1s），CPU 完成了多少帧。

在Unity底层，每帧 CPU 要做的事情非常多，但是在顶层的MonoBehavior中，暴露的函数接口却非常的少。
在本篇中，我们重点关注 _**Update()**_ 函数

## 跨帧内容分离

通过上文我们知道，CPU每帧都在特定的周期中执行*Update*。
首先我们需要两个容器来储存内容，它们分别为上一帧的数据内容以及这一帧将要产生的数据容器。

```
    private NativeArray<float> _finalResultA;
    private NativeArray<float> _finalResultB;
    private bool _isWritingToA = true;
```

从设计上可以看到，两者的设计完全一样，所以我们只需要使用一个标志位**isWritingToA**判断,并且在结束时需要做一次反转，并不需要刻意区分。

当然了我们需要跳过第一帧的渲染，因为没有渲染内容的。由于过于简单，这里不再演示。
至此我们区分了本帧数据与上一帧数据的界限。在代码中表现为了read与write。

```
    private void Update()
    {
        var writeBuffer = _isWritingToA ? _finalResultA : _finalResultB;
        var readBuffer = _isWritingToA ? _finalResultB : _finalResultA;

        //渲染上一帧的数据
        ...

        //写入本帧中的逻辑
        ...
        _isWritingToA = !_isWritingToA;
    }
```

### 物理事实

无论怎么设计，CPU 完成当前 _Update_ 任务的 Total Ms 并不会因为我们的设计而减少。  
总任务量不会消失。  
虽然在底层优化中，由于我们的读写分离设计，编译器以及系统可能会做出一些优化，但是此处可以忽略不计。

## 串行视角下的设计理论

观察上述代码，这个设计可谓是平平无奇，毫无特色。  
借助Unity提供的 `IEnumerator` 可以让这个设计变得稍微有点意思。  
方案非常简单，在类中加入一个 Mark 标记，借助 `IEnumerator` 的跨帧机制，可以将单帧压力分配到多帧中去。  
最终根据 Mark 标记来一次性渲染结果。  
简单的牺牲每帧的精确性，来换取流畅性方案。

> 这个设计在串行架构下本质就是非常鸡肋的设计。  
> 又或者说，这是串行架构在面对重型密集任务时的天然缺陷。

## 并行视角下的设计理论 - 任务重叠机制

在并行架构的设计下，这一套设计理念可以产生巨大的优势。
基于Unity本身的设计，在`Update`函数开头，我们需要放置一个同步点(Sync Point)，确保上一帧的并行任务完结，然后渲染数据。  
但是我们可以将本帧中的操作交给并行核心去实现。CPU此时只需要下发一个并行指令即可。

让我们理一下概念逻辑：

```text
 主线程 (Main Thread)                        并行核心 (Parallel Core)
 ━━━━━━━━━━━━━━━━━━━━                        ━━━━━━━━━━━━━━━━━━━━━━━
         ┃                                           ┃
  [1] Update Start                                   ┃
         ┃                                           ┃
  [2] Sync Point (等待上一帧) <━━━━━━━━━━━━━━━━━━━━━━━┫
         ┃                                           ┃
  [3] 渲染上一帧数据 (Render)                         ┃
         ┃                                           ┃
  [4] 打包本帧数据 (Pack)                             ┃
         ┃                                           ┃
  [5] 分发并行指令 (Dispatch) ━━━━━━━━━━━━━━━━━━━━━━━>┃
         ┃                                           ┃
         ┃ [任务重叠 Task Overlap]                    ┃ [并行 Job Working]
  [6] 处理本帧其他逻辑                                 ┃ [7] 并行处理计算任务
         ┃                                           ┃
  [8] Update End                                     ┃
         ┃                                           ┃
```

基于此种设计实现任务重叠，从主线程 CPU 分发完并行任务开始到下一帧的Sync Point之前，主线程 CPU 将从业务逻辑中完全解放出来。

在理想的情况下，每帧中主线程 CPU 只需要收割与结算上一帧的数据和下发新一轮并行指令。

## 结尾

基于Job System，在测试环境中，主线程如果压力较小，会将已经分出去的Job任务抢占回来。  
但是此时会产生额外的调度开销。
