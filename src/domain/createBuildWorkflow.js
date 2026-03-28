'use strict';

function createBuildWorkflow({ scenario, experiences, operationLogs }) {
  return {
    build_workflow_version: '1.0.0',
    build_workflow_id: 'build-001',
    target_scenario_ref: scenario.scenario_id,
    target_experience_refs: experiences.map((item) => item.experience_id),
    steps: [
      {
        id: 'build-step-001',
        step_type: 'select_knowledge',
        name: '选择知识对象',
        status: 'completed'
      },
      {
        id: 'build-step-002',
        step_type: 'compose_scenario',
        name: '组合场景',
        status: 'completed'
      },
      {
        id: 'build-step-003',
        step_type: 'configure_experience',
        name: '配置表达',
        status: 'completed'
      }
    ],
    operation_log_refs: operationLogs.map((item) => item.id),
    status: 'draft',
    validation: {}
  };
}

module.exports = { createBuildWorkflow };
