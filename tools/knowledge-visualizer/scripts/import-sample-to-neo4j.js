'use strict';

const neo4j = require('neo4j-driver');
const { buildKnowledgeGraphProjection } = require('../../../src/repository/knowledgeGraphProjection');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://127.0.0.1:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'knowledge123')
);

const clearOnly = process.argv.includes('--clear-only');

function toNodeRecord(node) {
  return {
    id: node.id,
    label: node.label || node.id,
    node_type: node.node_type || 'unknown',
    category: node.category || 'unknown',
    state_domain_ref: node.state_domain_ref || '',
    payload_json: JSON.stringify(node.raw || {})
  };
}

function toEdgeRecord(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    edge_type: edge.edge_type || 'related_to',
    category: edge.category || 'unknown',
    payload_json: JSON.stringify(edge.raw || {})
  };
}

async function run() {
  const session = driver.session();

  try {
    await session.run(
      'CREATE CONSTRAINT knowledge_node_id IF NOT EXISTS FOR (n:KnowledgeNode) REQUIRE n.id IS UNIQUE'
    );
    await session.run('MATCH (n:KnowledgeNode) DETACH DELETE n');

    if (clearOnly) {
      process.stdout.write('neo4j graph cleared\n');
      return;
    }

    const graph = buildKnowledgeGraphProjection({ include_audit: true });
    const nodes = graph.nodes.map(toNodeRecord);
    const edges = graph.edges.map(toEdgeRecord);

    await session.run(
      `
      UNWIND $nodes AS node
      MERGE (n:KnowledgeNode {id: node.id})
      SET n.label = node.label,
          n.node_type = node.node_type,
          n.category = node.category,
          n.state_domain_ref = node.state_domain_ref,
          n.payload_json = node.payload_json
      `,
      { nodes }
    );

    await session.run(
      `
      UNWIND $edges AS edge
      MATCH (source:KnowledgeNode {id: edge.source})
      MATCH (target:KnowledgeNode {id: edge.target})
      MERGE (source)-[r:KNOWLEDGE_EDGE {id: edge.id}]->(target)
      SET r.edge_type = edge.edge_type,
          r.category = edge.category,
          r.payload_json = edge.payload_json
      `,
      { edges }
    );

    process.stdout.write(
      `import completed: nodes=${nodes.length}, edges=${edges.length}, source=${graph.source}\n`
    );
  } finally {
    await session.close();
  }
}

run()
  .catch((error) => {
    process.stderr.write(`import failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close();
  });
