'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const standardKnowledge = require('../fixtures/standardKnowledge.valid.json');
const { validators } = require('../../src/validation/compileValidators');

test('standard knowledge fixture passes schema validation', () => {
  const valid = validators.standardKnowledge(standardKnowledge);

  assert.equal(valid, true);
});

test('scenario output passes scenario schema validation', () => {
  const scenario = {
    scenario_version: '1.0.0',
    scenario_id: 'scenario-001',
    name: '事项管理场景',
    goal: '组合事项处理能力',
    description: '从标准知识装配出的场景',
    selected_entity_refs: ['entity-001'],
    selected_behavior_refs: [],
    selected_event_refs: [],
    selected_relationship_refs: [],
    selected_business_flow_refs: ['business-flow-001'],
    selected_rule_refs: [],
    relationship_views: [],
    capabilities: [],
    boundaries: {},
    outputs: [],
    source_knowledge_refs: ['sk-001'],
    uncertainties: [],
    validation: {}
  };

  assert.equal(validators.scenario(scenario), true);
});
