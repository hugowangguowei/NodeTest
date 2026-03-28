'use strict';

function createExperience({ scenario, selection }) {
  const allowedFlows = new Set(scenario.selected_business_flow_refs || []);
  const allowedRelationshipViews = new Set(
    (scenario.relationship_views || []).map((item) => item.id)
  );

  for (const projection of selection.flow_projections) {
    if (!allowedFlows.has(projection.business_flow_ref)) {
      throw new Error(`flow projection outside scenario scope: ${projection.business_flow_ref}`);
    }
  }

  for (const projection of selection.relationship_projections) {
    if (!allowedRelationshipViews.has(projection.relationship_view_ref)) {
      throw new Error(
        `relationship projection outside scenario scope: ${projection.relationship_view_ref}`
      );
    }
  }

  return {
    experience_version: '1.0.0',
    experience_id: selection.experience_id,
    scenario_ref: scenario.scenario_id,
    experience_type: selection.experience_type,
    name: selection.name,
    description: selection.description,
    role_views: selection.role_views,
    workspace_cards: selection.workspace_cards,
    quick_actions: selection.quick_actions,
    flow_projections: selection.flow_projections,
    relationship_projections: selection.relationship_projections,
    layout_preferences: selection.layout_preferences,
    interaction_preferences: selection.interaction_preferences,
    uncertainties: [],
    validation: {}
  };
}

module.exports = { createExperience };
