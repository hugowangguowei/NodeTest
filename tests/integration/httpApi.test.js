'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const knowledge = require('../fixtures/standardKnowledge.valid.json');
const scenarioSelection = require('../fixtures/scenario.selection.json');
const { createApp } = require('../../src/server/createApp');

test('GET /health returns ok payload', async () => {
  const app = createApp();
  const response = await request(app).get('/health');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('POST /api/scenarios/compose returns a scenario payload', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/scenarios/compose')
    .send({ knowledge, selection: scenarioSelection });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.scenario_id, 'scenario-001');
});
