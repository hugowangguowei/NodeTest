'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const knowledge = require('../fixtures/standardKnowledge.valid.json');
const scenarioSelection = require('../fixtures/scenario.selection.json');
const { createApp } = require('../../src/server/createApp');

test('GET / returns the scenario builder shell', async () => {
  const app = createApp();
  const response = await request(app).get('/');

  assert.equal(response.statusCode, 200);
  assert.match(response.text, /软件工厂/);
  assert.match(response.text, /行业\/领域知识仓库/);
  assert.match(response.text, /定制软件定义区/);
  assert.match(response.text, /构建能力单元/);
  assert.match(response.text, /<button[^>]*>生成场景<\/button>/);
  assert.match(response.text, /<button[^>]*>生成表达<\/button>/);
  assert.match(response.text, /<button[^>]*>记录构建流程<\/button>/);
  assert.match(response.text, /<button[^>]*>执行工厂编排<\/button>/);
  assert.match(response.text, /<button[^>]*>执行统一回写<\/button>/);
});

test('GET /knowledge-graph.html returns the knowledge graph visualization page', async () => {
  const app = createApp();
  const response = await request(app).get('/knowledge-graph.html');

  assert.equal(response.statusCode, 200);
  assert.match(response.text, /知识图谱可视化/);
  assert.match(response.text, /data-role="graph-canvas"/);
});

test('GET /knowledge-graph-layered.html returns the layered graph visualization page', async () => {
  const app = createApp();
  const response = await request(app).get('/knowledge-graph-layered.html');

  assert.equal(response.statusCode, 200);
  assert.match(response.text, /知识图谱可视化（分层拓扑方案）/);
  assert.match(response.text, /data-role="layered-graph-svg"/);
});

test('GET /health returns ok payload', async () => {
  const app = createApp();
  const response = await request(app).get('/health');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('GET /api/workbench/bootstrap returns fixed sample data', async () => {
  const app = createApp();
  const response = await request(app).get('/api/workbench/bootstrap');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.knowledge.knowledge_id, 'sk-001');
  assert.equal(response.body.scenarioDraft.scenario_id, 'scenario-001');
  assert.equal(response.body.experienceTemplate.experience_id, 'experience-001');
  assert.equal(response.body.factoryCapabilities[0].id, 'factory-capability-001');
});

test('POST /api/scenarios/compose returns a scenario payload', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/scenarios/compose')
    .send({ knowledge, selection: scenarioSelection });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.scenario_id, 'scenario-001');
});

test('POST /api/repository/writeback applies unified update and can be observed', async () => {
  const app = createApp();

  const writebackResponse = await request(app).post('/api/repository/writeback').send({
    writeback_version: '1.0.0',
    operation_id: 'writeback-operation-001',
    source_type: 'factory_execution',
    target_domain: 'process_runtime',
    target_ref: 'flow-instance-001',
    mutation_type: 'patch',
    payload: {
      status: 'completed',
      approval_result: 'approved'
    },
    trace: {
      scenario_ref: 'scenario-001',
      experience_ref: 'experience-001',
      workflow_ref: 'build-001'
    },
    requested_at: '2026-04-02T00:00:00Z'
  });

  assert.equal(writebackResponse.statusCode, 200);
  assert.equal(writebackResponse.body.status, 'applied');
  assert.equal(writebackResponse.body.target_domain, 'process_runtime');
  assert.equal(writebackResponse.body.next_snapshot.status, 'completed');

  const logsResponse = await request(app).get('/api/repository/writeback/logs?limit=5');
  assert.equal(logsResponse.statusCode, 200);
  assert.equal(logsResponse.body.items.length, 1);
  assert.equal(logsResponse.body.items[0].operation_id, 'writeback-operation-001');

  const snapshotResponse = await request(app).get('/api/repository/writeback/snapshot');
  assert.equal(snapshotResponse.statusCode, 200);
  assert.equal(
    snapshotResponse.body.domains.process_runtime['flow-instance-001'].approval_result,
    'approved'
  );
});

test('POST /api/repository/writeback rejects invalid request payload', async () => {
  const app = createApp();
  const response = await request(app).post('/api/repository/writeback').send({
    operation_id: 'invalid-only-operation-id'
  });

  assert.equal(response.statusCode, 400);
  assert.ok(Array.isArray(response.body.errors));
  assert.ok(response.body.errors.length > 0);
});

test('GET /api/factory/catalog returns published factory objects by default', async () => {
  const app = createApp();
  const response = await request(app).get('/api/factory/catalog');

  assert.equal(response.statusCode, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.equal(response.body.total, response.body.items.length);
  assert.ok(response.body.items.length > 0);
  assert.ok(response.body.items.every((item) => item.lifecycle_status === 'published'));
});

test('POST /api/factory/compatibility/check returns conflict for unknown object refs', async () => {
  const app = createApp();
  const response = await request(app).post('/api/factory/compatibility/check').send({
    object_refs: ['factory-object-not-exist'],
    constraints: {
      require_published: true,
      allow_deprecated: false
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.compatible, false);
  assert.equal(response.body.conflicts[0].code, 'factory_object_not_found');
});

test('POST /api/factory/assembly/plan returns ordered plan for selected objects', async () => {
  const app = createApp();
  const response = await request(app).post('/api/factory/assembly/plan').send({
    request_id: 'assembly-request-001',
    scenario_ref: 'scenario-001',
    experience_ref: 'experience-001',
    selected_object_refs: ['factory-object-001', 'factory-object-002', 'factory-object-003'],
    constraints: {
      require_published: true,
      allow_deprecated: false
    }
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body.plan_id, /^assembly-plan-/);
  assert.equal(response.body.plan_steps.length, 3);
  assert.deepEqual(response.body.plan_steps.map((step) => step.object_ref), [
    'factory-object-001',
    'factory-object-002',
    'factory-object-003'
  ]);
  assert.equal(response.body.validation_result.status, 'ok');
});

test('POST /api/factory/assembly/execute executes planned steps and returns operation logs', async () => {
  const app = createApp();
  const planResponse = await request(app).post('/api/factory/assembly/plan').send({
    request_id: 'assembly-request-002',
    scenario_ref: 'scenario-001',
    experience_ref: 'experience-001',
    selected_object_refs: ['factory-object-001', 'factory-object-002'],
    constraints: {
      require_published: true,
      allow_deprecated: false
    }
  });

  assert.equal(planResponse.statusCode, 200);

  const executeResponse = await request(app).post('/api/factory/assembly/execute').send({
    plan_id: planResponse.body.plan_id
  });

  assert.equal(executeResponse.statusCode, 200);
  assert.match(executeResponse.body.execution_id, /^assembly-exec-/);
  assert.equal(executeResponse.body.step_results.length, 2);
  assert.equal(executeResponse.body.operation_log_refs.length, 2);
  assert.equal(executeResponse.body.errors.length, 0);
});

test('POST /api/factory/publish updates lifecycle for draft objects and can be queried', async () => {
  const app = createApp();
  const publishResponse = await request(app).post('/api/factory/publish').send({
    object_refs: ['factory-object-004']
  });

  assert.equal(publishResponse.statusCode, 200);
  assert.deepEqual(publishResponse.body.updated_refs, ['factory-object-004']);
  assert.equal(publishResponse.body.target_lifecycle_status, 'published');

  const catalogResponse = await request(app).get('/api/factory/catalog?kind=rule_pack');
  assert.equal(catalogResponse.statusCode, 200);
  assert.equal(catalogResponse.body.items.length, 1);
  assert.equal(catalogResponse.body.items[0].lifecycle_status, 'published');
});

test('GET /api/visualization/knowledge-graph returns graph projection payload', async () => {
  const app = createApp();
  const response = await request(app).get('/api/visualization/knowledge-graph');

  assert.equal(response.statusCode, 200);
  assert.ok(Array.isArray(response.body.nodes));
  assert.ok(Array.isArray(response.body.edges));
  assert.ok(response.body.nodes.length > 0);
  assert.ok(response.body.edges.length > 0);
  assert.ok(response.body.nodes.some((node) => node.id === 'entity-role-002'));
  assert.ok(response.body.edges.some((edge) => edge.edge_type === 'participates_in'));
});

test('GET /api/visualization/knowledge-graph respects include_audit and state_domain_ref filters', async () => {
  const app = createApp();
  const response = await request(app).get(
    '/api/visualization/knowledge-graph?include_audit=false&state_domain_ref=state-domain-001'
  );

  assert.equal(response.statusCode, 200);
  assert.ok(response.body.nodes.length > 0);
  assert.ok(response.body.nodes.every((node) => node.node_type !== 'operation_log'));
  assert.ok(response.body.nodes.every((node) => node.node_type !== 'state_snapshot'));
  assert.ok(
    response.body.nodes.every(
      (node) =>
        node.id === 'repo-001' ||
        node.id === 'state-domain-001' ||
        node.state_domain_ref === 'state-domain-001'
    )
  );
});

test('app.js exports a start entrypoint', () => {
  const appEntry = require('../../app');

  assert.equal(typeof appEntry.start, 'function');
});
