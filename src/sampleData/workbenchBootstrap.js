'use strict';

const knowledge = require('../../tests/fixtures/standardKnowledge.valid.json');
const experienceTemplate = require('../../tests/fixtures/experience.selection.json');

function getWorkbenchBootstrap() {
  return {
    knowledge,
    scenarioDraft: {
      scenario_id: 'scenario-001',
      name: '事项管理场景',
      goal: '组合事项处理能力',
      description: '从标准知识装配出的场景',
      selected_entity_refs: [],
      selected_behavior_refs: [],
      selected_event_refs: [],
      selected_relationship_refs: [],
      selected_business_flow_refs: [],
      selected_rule_refs: [],
      relationship_views: [],
      capabilities: [],
      boundaries: {},
      outputs: []
    },
    relationshipViews: [
      {
        id: 'relationship-view-001',
        name: '事项关系视角',
        relationship_refs: [],
        focus_refs: ['entity-001']
      }
    ],
    experienceTemplate
  };
}

module.exports = { getWorkbenchBootstrap };
