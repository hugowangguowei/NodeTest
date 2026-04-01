# 当前工程 Codex 工作策略

更新时间：2026-04-01

## 1. 目的

本文件用于把全局工程策略落地到当前工程，作为本项目后续分析、设计、实现、自测、验收和交接的执行基线。

本文件同时承担本地策略映射文档职责，明确：

- 本地文档根
- Tracker 现状
- 执行契约策略
- 项目特定测试入口

## 2. 当前工程的文档落点

当前工程统一使用以下文档目录：

- 文档根：`DOC/CodexAnylyse/`
- 总设计稿：`DOC/CodexAnylyse/设计稿/`
- 设计说明：`DOC/CodexAnylyse/设计说明/`
- 契约草案：`DOC/CodexAnylyse/契约草案/`
- 开发计划：`DOC/CodexAnylyse/开发计划/`
- 执行契约：`DOC/CodexAnylyse/开发计划/执行契约/`
- 历史计划：`DOC/CodexAnylyse/开发计划/历史计划/`
- 自测报告：`DOC/CodexAnylyse/自测报告/`
- 会话交接：`DOC/CodexAnylyse/会话交接/`
- 验收清单：`DOC/CodexAnylyse/验收清单/`
- 验收记录：`DOC/CodexAnylyse/验收记录/`
- 验收结论：`DOC/CodexAnylyse/验收结论/`
- 计划管理归档：`DOC/CodexAnylyse/计划管理归档/`

## 3. Tracker 与执行契约现状

### 3.1 Tracker 现状

当前项目已经接入 GitHub Project 和 GitHub Issue。

当前处理方式：

- Tracker 层：
  [NodeTest Delivery Roadmap](https://github.com/users/wgwtest/projects/2)
- 执行契约层：
  [Issue #7](https://github.com/hugowangguowei/NodeTest/issues/7)
  [Issue #8](https://github.com/hugowangguowei/NodeTest/issues/8)
  [Issue #1](https://github.com/hugowangguowei/NodeTest/issues/1)
  [Issue #2](https://github.com/hugowangguowei/NodeTest/issues/2)
  [Issue #3](https://github.com/hugowangguowei/NodeTest/issues/3)
  [Issue #9](https://github.com/hugowangguowei/NodeTest/issues/9)
  [Issue #10](https://github.com/hugowangguowei/NodeTest/issues/10)
  [Issue #11](https://github.com/hugowangguowei/NodeTest/issues/11)
  [Issue #12](https://github.com/hugowangguowei/NodeTest/issues/12)
  [Issue #13](https://github.com/hugowangguowei/NodeTest/issues/13)
  [Issue #14](https://github.com/hugowangguowei/NodeTest/issues/14)
  [Issue #15](https://github.com/hugowangguowei/NodeTest/issues/15)
  [Issue #16](https://github.com/hugowangguowei/NodeTest/issues/16)
  [Issue #17](https://github.com/hugowangguowei/NodeTest/issues/17)
- 长文档层仍在本地 `DOC/CodexAnylyse/`

补充说明：

- 由于当前活跃账号 `wgwtest` 对仓库 `hugowangguowei/NodeTest` 只有读取级仓库视图权限，Project 建在 `wgwtest` 名下
- 由于仓库允许创建 Issue，执行契约落在仓库 Issue 中
- 当前账号可创建/编辑 Issue 与 Project 条目字段
- 当前账号无 `AddSubIssue` 权限，无法建立 GitHub 原生父子 Issue 关系
- 当前账号无仓库标签维护权限，`gh label create/edit` 返回 `404`

### 3.2 执行契约策略

当前项目采用：

- `GitHub Project + GitHub Issue + Local Docs` 三层协同

模板位置：

- `DOC/CodexAnylyse/开发计划/03-执行契约模板.md`

当前 Tracker 字段基线：

- `Status`
- `Phase`
- `Contributes To`
- `Work Type`
- `WBS Level`
- `WBS Node`
- `Parent Node`
- `Start Date`
- `Target Date`

当前 Issue 契约基线：

- 统一使用 `WBS 节点` 段（编码、层级、父节点）
- 统一使用 `Depends On` 的 `#Issue编号` 引用
- 统一使用 `上级节点` 的 `#Issue编号` 或 `ROOT`

Issue 模板入口：

- `.github/ISSUE_TEMPLATE/00-wbs-parent-node.md`
- `.github/ISSUE_TEMPLATE/01-wbs-execution-node.md`

### 3.3 项目特定测试入口

当前项目的主要验证入口为：

- `npm test`
- `npm run lint`
- `npm start`
- 浏览器入口：`http://127.0.0.1:3000/`

## 4. 当前工程的执行规则

### 4.1 开始前

- 先读最近一次会话交接文档
- 先读当前有效计划或计划索引
- 先读最近一次验收清单和自测报告
- 先检查工作区状态
- 先明确本轮目标、非目标和验证方式

### 4.2 开发中

- 优先模型、契约、运行时和核心链路，再做页面与展示修正
- 保持变更范围聚焦到当前切片
- 不做与当前目标无关的文档或代码重排
- 页面原型中的临时术语不得直接上升为平台最终契约

### 4.3 开发后

- 至少执行最小静态检查与最小真实链路验证
- 有实际改动时，默认补充：
  - 验收清单
  - 自测报告或验收记录
  - 会话交接
- 在用户未明确确认验收结果前，阶段状态只能记为：
  - `待人工验收`
  - 或 `待用户确认`

## 5. 当前工程的验证顺序

推荐顺序：

1. 静态检查
2. 构建或启动验证
3. 关键运行链路验证
4. 页面或浏览器验证
5. 自测、验收清单与交接文档更新

## 6. 文档管理附加规则

### 6.1 根目录规则

根目录只保留长期入口文档，不再平铺阶段性设计稿、计划、自测和交接文件。

### 6.2 分类目录规则

- 总体性设计稿只保留 1 份，进入 `设计稿/`
- 对总设计稿的解释、细化和扩展进入 `设计说明/`
- 契约稿必须进入 `契约草案/`
- 稳定计划文档按 WBS 节点命名，进入 `开发计划/`
- 当前本地执行契约进入 `开发计划/执行契约/`
- 阶段性或过期计划必须进入 `开发计划/历史计划/`
- 自测工件必须进入 `自测报告/`
- 会话交接必须进入 `会话交接/`
- 计划管理过程说明进入 `计划管理归档/`

### 6.3 验收目录规则

验收类工件必须按类别拆分目录，不再混放到单一 `验收/` 目录：

- 验收清单：`验收清单/`
- 验收记录：`验收记录/`
- 验收结论：`验收结论/`

## 7. 当前工程后续默认遵循

从本文件更新开始，当前工程默认继续沿用这一套文档与工程策略。
