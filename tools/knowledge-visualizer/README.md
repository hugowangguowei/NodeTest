# 知识仓库可视化工具（Neo4j）

本目录是独立小工具，用于把知识仓库样例模型导入 Neo4j 并进行可视化检查。

## 1. 启动步骤

```bash
cd tools/knowledge-visualizer
npm install
npm run neo4j:up
npm run import:sample
```

启动后可访问：
- Neo4j Browser：`http://127.0.0.1:7474`
- 登录账号：`neo4j`
- 登录密码：`knowledge123`

## 2. 常用命令

```bash
# 清空图数据
npm run import:clear

# 打印推荐 Cypher 查询
npm run query:hints

# 停止工具
npm run neo4j:down
```

## 3. 数据来源

导入脚本默认读取：

`DOC/CODEX_DOC/04_研发文档/01_标准规范/2026-04-03-P2.1-知识仓库对象模型样例数据.json`

并通过 `src/repository/knowledgeGraphProjection.js` 转为图节点与边。

## 4. 验收建议

1. 在 Browser 中执行全图查询，确认实体/角色/行为/事件/流程都已入库。
2. 执行角色链路查询，确认“执行人员 -> 合规主管 -> 财务主管 -> 总经理”路径存在。
3. 修改样例数据后重新执行 `npm run import:sample`，确认更新可见。
