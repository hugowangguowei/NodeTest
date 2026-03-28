'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const knowledge = require('../fixtures/standardKnowledge.valid.json');
const selection = require('../fixtures/scenario.selection.json');
const { composeScenario } = require('../../src/domain/composeScenario');

test('composeScenario builds scenario from selected knowledge refs', () => {
  const scenario = composeScenario({
    knowledge,
    selection
  });

  assert.equal(scenario.scenario_id, 'scenario-001');
  assert.deepEqual(scenario.selected_entity_refs, ['entity-001']);
  assert.deepEqual(scenario.selected_business_flow_refs, ['business-flow-001']);
});
