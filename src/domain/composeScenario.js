'use strict';

function ensureRefsExist(items, refs, label) {
  const knownIds = new Set(items.map((item) => item.id));

  for (const ref of refs) {
    if (!knownIds.has(ref)) {
      throw new Error(`${label} ref not found: ${ref}`);
    }
  }
}

function composeScenario({ knowledge, selection }) {
  ensureRefsExist(knowledge.entities, selection.selected_entity_refs, 'entity');
  ensureRefsExist(knowledge.business_flows, selection.selected_business_flow_refs, 'business_flow');

  return {
    scenario_version: '1.0.0',
    scenario_id: selection.scenario_id,
    name: selection.name,
    goal: selection.goal,
    description: selection.description,
    selected_entity_refs: selection.selected_entity_refs,
    selected_behavior_refs: selection.selected_behavior_refs,
    selected_event_refs: selection.selected_event_refs,
    selected_relationship_refs: selection.selected_relationship_refs,
    selected_business_flow_refs: selection.selected_business_flow_refs,
    selected_rule_refs: selection.selected_rule_refs,
    relationship_views: selection.relationship_views,
    capabilities: selection.capabilities,
    boundaries: selection.boundaries,
    outputs: selection.outputs,
    source_knowledge_refs: [knowledge.knowledge_id],
    uncertainties: [],
    validation: {}
  };
}

module.exports = { composeScenario };
