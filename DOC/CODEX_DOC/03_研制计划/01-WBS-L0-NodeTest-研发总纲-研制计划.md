# WBS L0 NodeTest 研发总纲

更新时间：2026-04-01

状态：`当前有效`

## 1. 文档目的

本文档是当前工程的 L0 稳定研发总纲。

它回答：

1. 项目整体交付轮廓如何分解
2. 各大块之间的先后关系是什么
3. 里程碑门代表什么
4. 当前活动节点位于哪里

## 2. WBS L0 根结构

当前工程按以下 L0 节点分解：

L0 根节点：

- [Issue #7 - L0 研发总纲与路线图治理](https://github.com/hugowangguowei/NodeTest/issues/7)

### P1 平台定义与原型收敛

目标：

- 按「需求分析 -> 原型设计 -> 模块实现」推进 P1，保证每一步有明确文档和代码输出

Tracker：

- [Issue #8 - P1 需求分析-原型设计-模块实现（父节点）](https://github.com/hugowangguowei/NodeTest/issues/8)
- [Issue #1 - P1.1 需求分析](https://github.com/hugowangguowei/NodeTest/issues/1)
- [Issue #2 - P1.2 原型设计与交互方案](https://github.com/hugowangguowei/NodeTest/issues/2)
- [Issue #3 - P1.3 模块实现与最小联调闭环](https://github.com/hugowangguowei/NodeTest/issues/3)

### P2 知识仓库与工厂模型深化

目标：

- 把知识仓库从固定样本切面推进到更可浏览的仓储形态
- 把软件工厂内部异构对象逐步落为更稳定的对象模型和接口

Tracker：

- [Issue #5 - P2 阶段父节点](https://github.com/hugowangguowei/NodeTest/issues/5)
- [Issue #9 - P2.1 知识仓库状态域与对象模型基线](https://github.com/hugowangguowei/NodeTest/issues/9)
- [Issue #10 - P2.2 软件工厂异构对象编排契约](https://github.com/hugowangguowei/NodeTest/issues/10)
- [Issue #11 - P2.3 仓库统一更新链路与验证](https://github.com/hugowangguowei/NodeTest/issues/11)

### P3 定制软件定义态增强

目标：

- 把当前 JSON 输出式定义态推进为更完整的软件定义视图
- 增强终端中的工作台表达、透视结构和定义可读性

Tracker：

- [Issue #4 - P3 阶段父节点](https://github.com/hugowangguowei/NodeTest/issues/4)
- [Issue #12 - P3.1 定制软件定义态视图模型](https://github.com/hugowangguowei/NodeTest/issues/12)
- [Issue #13 - P3.2 工作台卡片与透视定义能力](https://github.com/hugowangguowei/NodeTest/issues/13)
- [Issue #14 - P3.3 定义态验收脚本与证据闭环](https://github.com/hugowangguowei/NodeTest/issues/14)

### P4 终端运行态与统一回写

目标：

- 将终端从定义态逐步推进到可交互运行态
- 建立统一状态回写和事件联动机制

Tracker：

- [Issue #6 - P4 阶段父节点](https://github.com/hugowangguowei/NodeTest/issues/6)
- [Issue #15 - P4.1 运行态会话与事件链路](https://github.com/hugowangguowei/NodeTest/issues/15)
- [Issue #16 - P4.2 统一回写执行链与一致性校验](https://github.com/hugowangguowei/NodeTest/issues/16)
- [Issue #17 - P4.3 运行态验收与门禁闭环](https://github.com/hugowangguowei/NodeTest/issues/17)

## 3. 当前 L0 节点关系

推进顺序建议如下：

1. `P1` 先稳定定义与原型
2. `P2` 深化仓库与工厂模型
3. `P3` 强化软件定义态表现
4. `P4` 再扩展到运行态与统一回写

说明：

- `P2` 与 `P3` 存在局部可并行 Prep
- `P4` 依赖前两者核心输出更稳定后再正式进入 Core

## 4. 里程碑门定义

当前采用以下里程碑门：

### M1 定义与原型门

通过条件：

1. 总设计稿和配套说明已稳定
2. WBS 计划层已稳定
3. 浏览器原型可人工验收

### M2 模型深化门

通过条件：

1. 知识仓库和软件工厂内部模型更稳定
2. 工厂异构对象关系不再只停留在概念层

### M3 定义态增强门

通过条件：

1. 软件定义态可读性和结构表达显著增强
2. 终端中的表达和透视更接近真实产品

### M4 运行态闭环门

通过条件：

1. 终端运行态链路可验证
2. 统一状态回写可观察

## 5. 当前活动节点

当前活动节点为：

- `P1 平台定义与原型收敛`

对应当前 L1 计划：

- [02-WBS-L1-P1-平台定义与原型收敛](DOC/CODEX_DOC/03_研制计划/02-WBS-L1-P1-平台定义与原型收敛-研制计划.md)

当前路线图 Project：

- 主入口：[NodeTest Delivery Roadmap（owner）](https://github.com/users/hugowangguowei/projects/1)
- 镜像入口：[NodeTest Delivery Roadmap（mirror）](https://github.com/users/wgwtest/projects/2)

## 6. Prep / Core 说明

在当前阶段，以下工作允许作为 Prep 继续推进：

1. 文档结构稳定化
2. 契约草案补充
3. 样本数据整理
4. 浏览器原型的低耦合说明性增强

以下工作不应在上游仍待人工验收时被当作 Core 正式开始：

1. 大规模运行态机制扩展
2. 深度持久化仓库实现
3. 外部 Provider 正式接入

## 7. 当前结论

当前项目已经从“无稳定计划面”升级为“L0 总纲 + L1 当前计划”的结构。

后续新增计划必须挂接到本总纲，不再与其并列生长。

当前 Tracker 树形已对齐为 `L0(#7) -> L1(P1/P2/P3/P4) -> L2(执行节点)`，后续新增节点应继续沿用该树结构。

说明：

- 当前已启用 GitHub 原生 Sub-issue，树形关系为主表达
- `Project 字段（WBS Level/WBS Node/Parent Node）+ Issue 正文（WBS 节点/上级节点/子节点索引）` 继续作为冗余校验与导航表达
