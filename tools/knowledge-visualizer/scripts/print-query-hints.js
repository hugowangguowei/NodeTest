'use strict';

const hints = [
  {
    title: '查看全部节点与关系',
    cypher:
      'MATCH (n:KnowledgeNode)-[r:KNOWLEDGE_EDGE]->(m:KnowledgeNode) RETURN n, r, m LIMIT 500'
  },
  {
    title: '仅查看角色相关链路',
    cypher:
      "MATCH (role:KnowledgeNode)-[r:KNOWLEDGE_EDGE]->(m:KnowledgeNode) WHERE role.node_type = 'entity' AND role.payload_json CONTAINS 'person_role' RETURN role, r, m LIMIT 200"
  },
  {
    title: '查看审批链路',
    cypher:
      "MATCH p=(a:KnowledgeNode)-[:KNOWLEDGE_EDGE*1..4]->(b:KnowledgeNode) WHERE a.id = 'entity-role-005' AND b.id = 'entity-role-002' RETURN p LIMIT 20"
  },
  {
    title: '查看指定状态域',
    cypher:
      "MATCH (n:KnowledgeNode) WHERE n.state_domain_ref = 'state-domain-001' RETURN n LIMIT 300"
  }
];

hints.forEach((hint, index) => {
  process.stdout.write(`${index + 1}. ${hint.title}\n${hint.cypher}\n\n`);
});
