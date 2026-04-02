---
name: WBS 执行节点任务卡
about: 用于 L2 执行节点，承载可执行契约、依赖、验收与证据回链
title: '[P?.?] <执行节点名称>'
labels: ''
assignees: ''
---

WBS 节点：
- 编码：P1.1 / P1.2 / ...
- 层级：L2
- 父节点：#<L1父节点Issue编号>

目标：
- ...

Owner：
- Codex / User

Write Scope：
- ...

Depends On：
- #<前置Issue编号> / 无

验收入口：
- 主入口：...
- 辅助入口：...

验收标准：
- ...

输出物：
- ...

证据链接：
- 计划文档：...
- 设计文档：...
- 自测报告：...
- 验收清单：...
- 交接记录：...

当前状态：
- 待开发 / 开发中 / 已自测 / 待人工验收 / 已验收 / 阻塞中

上级节点：
- #<L1父节点Issue编号>

路径规范：
- GitHub Issue / Project 中的路径统一写仓库相对路径（如 `src/server/routes.js`、`DOC/CodexAnylyse/设计说明/...`）
- 需要可点击入口时，补充 GitHub 仓库 URL（如 `https://github.com/<owner>/<repo>/blob/<branch>/src/...`）
- 禁止写本机绝对路径（如 `/home/wgw/...`）
