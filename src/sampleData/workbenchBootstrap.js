'use strict';

const knowledge = require('../../tests/fixtures/standardKnowledge.valid.json');
const experienceTemplate = require('../../tests/fixtures/experience.selection.json');

function getWorkbenchBootstrap() {
  return {
    repositoryMeta: {
      id: 'repository-meta-001',
      name: '跨领域知识与状态仓库',
      positioning: '行业/领域知识仓库 + 统一状态数据仓库',
      domain_scope: knowledge.domain_scope,
      description: '承载标准知识、状态集合与软件构建所需基础材料，所有定制软件对仓库的操作都会统一回写。'
    },
    knowledge,
    stateCollections: [
      {
        id: 'state-collection-001',
        name: '基础资料状态集',
        state_type: 'base_records',
        update_policy: '统一更新',
        description: '沉淀实体基础资料、状态快照和跨应用共享字段。'
      },
      {
        id: 'state-collection-002',
        name: '事件流程状态集',
        state_type: 'event_flow_runtime',
        update_policy: '统一更新',
        description: '沉淀事件、审批流和流程节点运行状态，可被多个应用复用。'
      }
    ],
    factoryCapabilities: [
      {
        id: 'factory-capability-001',
        name: '工作流 Skill',
        capability_type: 'skill',
        stage: 'definition',
        description: '把标准知识和已选要素拼装成可执行的流程定义骨架。'
      },
      {
        id: 'factory-capability-002',
        name: '界面模板组件',
        capability_type: 'component',
        stage: 'assembly',
        description: '为终端装配工作台卡片、快捷动作和关系透视界面。'
      },
      {
        id: 'factory-capability-003',
        name: '消息联动插件',
        capability_type: 'plugin',
        stage: 'runtime',
        description: '把软件定义中的事件流转接入消息通知与异步处理链路。'
      }
    ],
    scenarioDraft: {
      scenario_id: 'scenario-001',
      name: '事项管理软件',
      goal: '为事项协同构建定制软件定义',
      description: '从知识仓库选定要素并在软件工厂中组合出的软件定义草案',
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
    experienceTemplate,
    softwareIntentTemplate: {
      software_name: '事项协同终端',
      target_users: '事项处理人员、主管、协同角色',
      usage_expectation: '围绕事项生命周期提供统一入口、流程驱动和状态联动的软件定义。',
      delivery_mode: 'software_definition'
    }
  };
}

module.exports = { getWorkbenchBootstrap };
