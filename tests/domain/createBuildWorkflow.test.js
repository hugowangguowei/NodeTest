'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createBuildWorkflow } = require('../../src/domain/createBuildWorkflow');

test('createBuildWorkflow records scenario and experience assembly trace', () => {
  const workflow = createBuildWorkflow({
    scenario: { scenario_id: 'scenario-001' },
    experiences: [{ experience_id: 'experience-001' }],
    operationLogs: [{ id: 'operation-log-001' }]
  });

  assert.equal(workflow.target_scenario_ref, 'scenario-001');
  assert.deepEqual(workflow.target_experience_refs, ['experience-001']);
  assert.equal(workflow.status, 'draft');
});
