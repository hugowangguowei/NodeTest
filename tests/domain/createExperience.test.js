'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const selection = require('../fixtures/experience.selection.json');
const { createExperience } = require('../../src/domain/createExperience');

test('createExperience projects workspace cards and flow views from scenario scope', () => {
  const scenario = {
    scenario_id: 'scenario-001',
    selected_business_flow_refs: ['business-flow-001'],
    relationship_views: [{ id: 'relationship-view-001' }]
  };

  const experience = createExperience({ scenario, selection });

  assert.equal(experience.experience_type, 'personal_workspace');
  assert.equal(experience.scenario_ref, 'scenario-001');
  assert.equal(experience.flow_projections[0].business_flow_ref, 'business-flow-001');
});
