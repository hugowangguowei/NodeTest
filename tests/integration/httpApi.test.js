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
  assert.match(response.text, /场景构建台/);
  assert.match(response.text, /知识要素区/);
  assert.match(response.text, /场景组合区/);
  assert.match(response.text, /输出区/);
  assert.match(response.text, /<button[^>]*>生成场景<\/button>/);
  assert.match(response.text, /<button[^>]*>生成表达<\/button>/);
  assert.match(response.text, /<button[^>]*>记录构建流程<\/button>/);
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
});

test('POST /api/scenarios/compose returns a scenario payload', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/scenarios/compose')
    .send({ knowledge, selection: scenarioSelection });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.scenario_id, 'scenario-001');
});

test('app.js exports a start entrypoint', () => {
  const appEntry = require('../../app');

  assert.equal(typeof appEntry.start, 'function');
});
