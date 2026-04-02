# 开发计划 README

更新时间：2026-04-02

状态：`当前有效`

## 1. 这份文档解决什么问题

本文件是当前项目开发计划层的唯一入口。

它用于明确：

1. 当前活动 WBS 节点
2. 研发路线图放在哪里
3. 当前执行切片放在哪里
4. 历史计划如何处理
5. 执行契约按什么模板组织

## 2. 当前计划面结构

当前开发计划层固定为：

1. [00-开发计划README](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/00-开发计划README.md)
2. [01-WBS-L0-NodeTest-研发总纲](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/01-WBS-L0-NodeTest-研发总纲.md)
3. [02-WBS-L1-P1-平台定义与原型收敛](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/02-WBS-L1-P1-平台定义与原型收敛.md)
4. [03-执行契约模板](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/03-执行契约模板.md)
5. [P1子节点清单文档](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/P1子节点清单文档.md)
6. `执行契约/`
7. `历史计划/`

## 3. 当前活动 WBS 节点

当前活动节点固定为：

- `P1 平台定义与原型收敛`

当前活动计划文件为：

- [02-WBS-L1-P1-平台定义与原型收敛](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/02-WBS-L1-P1-平台定义与原型收敛.md)

## 4. 当前路线图位置

项目稳定路线图位于：

- [01-WBS-L0-NodeTest-研发总纲](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/01-WBS-L0-NodeTest-研发总纲.md)

该文档负责：

1. 给出 L0 WBS 总体分解
2. 说明里程碑门含义
3. 标识各大块的推进顺序

## 5. 当前执行方式

当前项目已接入 GitHub Tracker。

当前采用三层协同：

1. Tracker 层：GitHub Project
2. 执行契约层：GitHub Issue
3. 长文档层：本地 `DOC/CodexAnylyse/`

当前 Tracker 入口：

- GitHub Project（主入口）：
  [NodeTest Delivery Roadmap（owner）](https://github.com/users/hugowangguowei/projects/1)
- GitHub Project（镜像）：
  [NodeTest Delivery Roadmap（mirror）](https://github.com/users/wgwtest/projects/2)
- WBS 根节点：
  [Issue #7 - L0 研发总纲与路线图治理](https://github.com/hugowangguowei/NodeTest/issues/7)

当前执行契约入口：

- P1 父节点：
  [Issue #8 - P1 需求分析-原型设计-模块实现（父节点）](https://github.com/hugowangguowei/NodeTest/issues/8)
- P1 执行节点：
  [Issue #1 - P1.1 需求分析与验收基线](https://github.com/hugowangguowei/NodeTest/issues/1)
  [Issue #2 - P1.2 原型设计与交互方案](https://github.com/hugowangguowei/NodeTest/issues/2)
  [Issue #3 - P1.3 模块实现与最小联调闭环](https://github.com/hugowangguowei/NodeTest/issues/3)
- P2 父节点：
  [Issue #5 - P2 知识仓库与工厂模型深化（父节点）](https://github.com/hugowangguowei/NodeTest/issues/5)
- P2 执行节点：
  [Issue #9 - P2.1 知识仓库状态域与对象模型基线](https://github.com/hugowangguowei/NodeTest/issues/9)
  [Issue #10 - P2.2 软件工厂异构对象编排契约](https://github.com/hugowangguowei/NodeTest/issues/10)
  [Issue #11 - P2.3 仓库统一更新链路与验证](https://github.com/hugowangguowei/NodeTest/issues/11)
- P3 父节点：
  [Issue #4 - P3 定制软件定义态增强（父节点）](https://github.com/hugowangguowei/NodeTest/issues/4)
- P3 执行节点：
  [Issue #12 - P3.1 定制软件定义态视图模型](https://github.com/hugowangguowei/NodeTest/issues/12)
  [Issue #13 - P3.2 工作台卡片与透视定义能力](https://github.com/hugowangguowei/NodeTest/issues/13)
  [Issue #14 - P3.3 定义态验收脚本与证据闭环](https://github.com/hugowangguowei/NodeTest/issues/14)
- P4 父节点：
  [Issue #6 - P4 终端运行态与统一回写（父节点）](https://github.com/hugowangguowei/NodeTest/issues/6)
- P4 执行节点：
  [Issue #15 - P4.1 运行态会话与事件链路](https://github.com/hugowangguowei/NodeTest/issues/15)
  [Issue #16 - P4.2 统一回写执行链与一致性校验](https://github.com/hugowangguowei/NodeTest/issues/16)
  [Issue #17 - P4.3 运行态验收与门禁闭环](https://github.com/hugowangguowei/NodeTest/issues/17)

当前规则：

1. WBS 节点和长说明继续在本地计划文档中维护
2. 执行契约最小任务单同步落到 GitHub Issue
3. 严格树形真源固定为 `GitHub Issues + Sub-issues`
4. 状态、阶段、里程碑归属、工作类型、WBS 层级、WBS 编码、父节点编码和日期在 GitHub Project 中维护
5. 同级节点顺序固定按 WBS 编码维护（`P1 -> P2 -> P3 -> P4`）
6. 顺序同步必须覆盖：Sub-issue 顺序、Issue 正文子节点索引、Project item 顺序
7. GitHub 协作中的路径描述统一使用仓库相对路径，禁止本机绝对路径
8. 自测、验收、交接继续通过本地文档回链

说明：

- 当前主 Project 建在 `hugowangguowei` 名下
- `wgwtest` 名下 Project 作为镜像视图同步维护
- 执行 Issue 建在仓库 `hugowangguowei/NodeTest`
- 当前账号已启用 `AddSubIssue`，树形以 GitHub 原生父子 Issue 为主，并保留 `WBS Node + Parent Node + Issue正文父子索引` 冗余表达
- 当前账号已启用标签治理，Issue 统一使用 `wbs:* + phase:* + work:*` 标签组

## 6. 历史计划处理规则

历史阶段计划统一放入：

- `开发计划/历史计划/`

这些文件保留用于：

1. 回溯当时阶段判断
2. 解释当前原型为何会形成现状
3. 为后续新计划提供上下文

它们不再作为当前执行入口。

## 7. 执行契约规则

如果后续拆出更细任务，执行契约应按以下模板组织：

- [03-执行契约模板](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/03-执行契约模板.md)

当前有效执行契约入口：

- [执行契约/00-执行契约README](/home/wgw/CodexProject/NodeTest/DOC/CodexAnylyse/开发计划/执行契约/00-执行契约README.md)
- `.github/ISSUE_TEMPLATE/00-wbs-parent-node.md`
- `.github/ISSUE_TEMPLATE/01-wbs-execution-node.md`

## 8. 当前结论

从现在开始，开发计划层不再依赖“当前阶段计划”这类临时命名。

稳定计划文件以 WBS 节点命名，当前活动节点通过本文件标识，而不是靠反复改文件名表达。
