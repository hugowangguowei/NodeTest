'use strict';

const state = {
  bootstrap: null,
  activeTab: 'scenario',
  selectedEntityRefs: new Set(),
  selectedBusinessFlowRefs: new Set(),
  selectedRelationshipViewIds: new Set(),
  selectedFactoryCapabilityIds: new Set(),
  currentScenario: null,
  currentExperience: null,
  currentWorkflow: null,
  currentFactoryOrchestration: null,
  currentWriteback: null,
  errors: []
};

function getElements() {
  return {
    repositoryMeta: document.querySelector('[data-role="repository-meta"]'),
    stateCollectionList: document.querySelector('[data-role="state-collection-list"]'),
    entityList: document.querySelector('[data-role="entity-list"]'),
    flowList: document.querySelector('[data-role="flow-list"]'),
    relationshipList: document.querySelector('[data-role="relationship-list"]'),
    factoryCapabilityList: document.querySelector('[data-role="factory-capability-list"]'),
    selectedSummary: document.querySelector('[data-role="selected-summary"]'),
    outputShell: document.querySelector('[data-role="output-shell"]'),
    errorBanner: document.querySelector('[data-role="error-banner"]'),
    scenarioId: document.querySelector('[data-role="scenario-id"]'),
    scenarioName: document.querySelector('[data-role="scenario-name"]'),
    scenarioGoal: document.querySelector('[data-role="scenario-goal"]'),
    scenarioDescription: document.querySelector('[data-role="scenario-description"]'),
    targetUsers: document.querySelector('[data-role="target-users"]'),
    tabs: Array.from(document.querySelectorAll('[data-role="tab"]')),
    generateScenarioButton: document.querySelector('[data-role="generate-scenario"]'),
    generateExperienceButton: document.querySelector('[data-role="generate-experience"]'),
    recordWorkflowButton: document.querySelector('[data-role="record-workflow"]'),
    executeFactoryOrchestrationButton: document.querySelector('[data-role="execute-factory-orchestration"]'),
    executeWritebackButton: document.querySelector('[data-role="execute-writeback"]'),
    resetButton: document.querySelector('[data-role="reset-builder"]')
  };
}

function setError(message) {
  state.errors = [message];
  renderErrorBanner();
  renderOutput();
}

function clearError() {
  state.errors = [];
  renderErrorBanner();
  renderOutput();
}

function renderErrorBanner() {
  const { errorBanner } = getElements();

  if (state.errors.length === 0) {
    errorBanner.hidden = true;
    errorBanner.textContent = '';
    return;
  }

  errorBanner.hidden = false;
  errorBanner.textContent = state.errors.join('\n');
}

function renderOptionList(container, items, selectedSet, label) {
  container.innerHTML = '';

  items.forEach((item) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'option-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedSet.has(item.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedSet.add(item.id);
      } else {
        selectedSet.delete(item.id);
      }
      renderSelectionSummary();
      renderOutput();
    });

    const meta = document.createElement('div');
    meta.className = 'option-meta';
    meta.innerHTML = `<strong>${item.name}</strong><span>${label}</span><span>${item.description || ''}</span>`;

    wrapper.append(checkbox, meta);
    container.append(wrapper);
  });
}

function renderStaticList(container, items, label) {
  container.innerHTML = '';

  items.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-item is-static';

    const meta = document.createElement('div');
    meta.className = 'option-meta';
    meta.innerHTML =
      `<strong>${item.name}</strong>` +
      `<span>${label}</span>` +
      `<span>${item.description || ''}</span>` +
      `<span>更新策略: ${item.update_policy || 'n/a'}</span>`;

    wrapper.append(meta);
    container.append(wrapper);
  });
}

function renderRepositoryMeta() {
  const { repositoryMeta } = getElements();
  const meta = state.bootstrap.repositoryMeta;

  repositoryMeta.innerHTML = [
    `<span class="chip">${meta.name}</span>`,
    `<span class="chip">范围：${meta.domain_scope}</span>`,
    `<span class="chip">定位：${meta.positioning}</span>`,
    `<span class="chip">特征：统一回写</span>`
  ].join('');
}

function getSoftwareIntent() {
  const { scenarioId, scenarioName, scenarioGoal, scenarioDescription, targetUsers } = getElements();

  return {
    software_definition_id: scenarioId.value.trim(),
    software_name: scenarioName.value.trim(),
    target_users: targetUsers.value.trim(),
    usage_expectation: scenarioGoal.value.trim(),
    software_description: scenarioDescription.value.trim(),
    delivery_mode: state.bootstrap.softwareIntentTemplate.delivery_mode
  };
}

function getSelectedCapabilities() {
  return state.bootstrap.factoryCapabilities.filter((item) =>
    state.selectedFactoryCapabilityIds.has(item.id)
  );
}

function resolveFactoryObjectRefs() {
  const capabilityToObjectRef = {
    'factory-capability-001': 'factory-object-001',
    'factory-capability-002': 'factory-object-002',
    'factory-capability-003': 'factory-object-003'
  };

  return Array.from(state.selectedFactoryCapabilityIds)
    .map((id) => capabilityToObjectRef[id])
    .filter(Boolean);
}

function renderSelectionSummary() {
  const { selectedSummary } = getElements();
  const intent = getSoftwareIntent();

  selectedSummary.innerHTML = [
    `<span class="chip">软件：${intent.software_name || '未填写'}</span>`,
    `<span class="chip">面向对象：${intent.target_users || '未填写'}</span>`,
    `<span class="chip">已选实体：${state.selectedEntityRefs.size}</span>`,
    `<span class="chip">已选业务流程：${state.selectedBusinessFlowRefs.size}</span>`,
    `<span class="chip">已选关系视角：${state.selectedRelationshipViewIds.size}</span>`,
    `<span class="chip">构建能力：${state.selectedFactoryCapabilityIds.size}</span>`
  ].join('');
}

function buildScenarioSelection() {
  const intent = getSoftwareIntent();

  return {
    scenario_id: intent.software_definition_id,
    name: intent.software_name,
    goal: intent.usage_expectation,
    description: intent.software_description,
    selected_entity_refs: Array.from(state.selectedEntityRefs),
    selected_behavior_refs: [],
    selected_event_refs: [],
    selected_relationship_refs: [],
    selected_business_flow_refs: Array.from(state.selectedBusinessFlowRefs),
    selected_rule_refs: [],
    relationship_views: state.bootstrap.relationshipViews.filter((item) =>
      state.selectedRelationshipViewIds.has(item.id)
    ),
    capabilities: getSelectedCapabilities().map((item) => item.id),
    boundaries: {
      data_repository: state.bootstrap.repositoryMeta.id,
      state_collection_ids: state.bootstrap.stateCollections.map((item) => item.id)
    },
    outputs: ['software_definition', 'workspace_experience', 'build_workflow']
  };
}

function buildExperienceSelection() {
  const template = state.bootstrap.experienceTemplate;

  return {
    ...template,
    name: `${getSoftwareIntent().software_name}工作台`,
    description: `围绕${getSoftwareIntent().software_name}生成的定制工作台表达`,
    quick_actions: getSelectedCapabilities().map((item) => ({
      id: `quick-action-${item.id}`,
      name: `调用${item.name}`,
      action_type: item.capability_type,
      source_ref: item.id
    })),
    flow_projections: template.flow_projections.filter((item) =>
      state.selectedBusinessFlowRefs.has(item.business_flow_ref)
    ),
    relationship_projections: template.relationship_projections.filter((item) =>
      state.selectedRelationshipViewIds.has(item.relationship_view_ref)
    )
  };
}

function getSoftwareDefinitionView() {
  return {
    software_definition_version: '0.1.0',
    repository: state.bootstrap.repositoryMeta,
    software_intent: getSoftwareIntent(),
    selected_knowledge: {
      entity_refs: Array.from(state.selectedEntityRefs),
      business_flow_refs: Array.from(state.selectedBusinessFlowRefs),
      relationship_view_ids: Array.from(state.selectedRelationshipViewIds)
    },
    factory_assembly: {
      capability_ids: Array.from(state.selectedFactoryCapabilityIds),
      capability_units: getSelectedCapabilities()
    },
    generated_scenario: state.currentScenario || { message: '尚未生成软件定义场景' }
  };
}

function getExperienceView() {
  return {
    software_terminal_view: state.currentExperience || { message: '尚未生成工作台表达' },
    state_sync_policy: {
      repository_ref: state.bootstrap.repositoryMeta.id,
      state_collection_ids: state.bootstrap.stateCollections.map((item) => item.id),
      mode: 'unified_update'
    }
  };
}

function getWorkflowView() {
  return {
    build_workflow: state.currentWorkflow || { message: '尚未记录构建流程' },
    operation_context: {
      software_definition_id: getSoftwareIntent().software_definition_id,
      capability_ids: Array.from(state.selectedFactoryCapabilityIds)
    }
  };
}

function getFactoryOrchestrationView() {
  return {
    factory_orchestration: state.currentFactoryOrchestration || { message: '尚未执行工厂编排' },
    mapped_factory_object_refs: resolveFactoryObjectRefs()
  };
}

function getWritebackView() {
  return {
    unified_writeback: state.currentWriteback || { message: '尚未执行统一回写' },
    target_state_collection_ids: state.bootstrap.stateCollections.map((item) => item.id)
  };
}

function getOutputPayload() {
  if (state.activeTab === 'scenario') {
    return getSoftwareDefinitionView();
  }

  if (state.activeTab === 'experience') {
    return getExperienceView();
  }

  if (state.activeTab === 'workflow') {
    return getWorkflowView();
  }

  if (state.activeTab === 'factory') {
    return getFactoryOrchestrationView();
  }

  if (state.activeTab === 'writeback') {
    return getWritebackView();
  }

  return state.errors.length > 0 ? { errors: state.errors } : { message: '当前无错误' };
}

function renderOutput() {
  const { outputShell, tabs } = getElements();

  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.tab === state.activeTab);
  });

  outputShell.textContent = JSON.stringify(getOutputPayload(), null, 2);
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function handleGenerateScenario() {
  clearError();

  if (state.selectedEntityRefs.size === 0 || state.selectedBusinessFlowRefs.size === 0) {
    setError('至少选择一个实体和一个业务流程后，才能生成场景。');
    return;
  }

  if (state.selectedFactoryCapabilityIds.size === 0) {
    setError('至少选择一个构建能力单元后，才能生成软件定义。');
    return;
  }

  const scenario = await postJson('/api/scenarios/compose', {
    knowledge: state.bootstrap.knowledge,
    selection: buildScenarioSelection()
  });

  state.currentScenario = scenario;
  state.activeTab = 'scenario';
  renderOutput();
}

async function handleGenerateExperience() {
  clearError();

  if (!state.currentScenario) {
    setError('请先生成软件定义，再生成表达。');
    return;
  }

  const experience = await postJson('/api/experiences/create', {
    scenario: state.currentScenario,
    selection: buildExperienceSelection()
  });

  state.currentExperience = experience;
  state.activeTab = 'experience';
  renderOutput();
}

async function handleRecordWorkflow() {
  clearError();

  if (!state.currentScenario || !state.currentExperience) {
    setError('请先生成软件定义和表达，再记录构建流程。');
    return;
  }

  const workflow = await postJson('/api/build-workflows/create', {
    scenario: state.currentScenario,
    experiences: [state.currentExperience],
    operationLogs: [
      {
        id: `operation-log-${Date.now()}`
      }
    ]
  });

  state.currentWorkflow = workflow;
  state.activeTab = 'workflow';
  renderOutput();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function handleExecuteWriteback() {
  clearError();

  if (
    !state.currentScenario ||
    !state.currentExperience ||
    !state.currentWorkflow ||
    !state.currentFactoryOrchestration
  ) {
    setError('请先完成场景、表达、构建流程和工厂编排，再执行统一回写。');
    return;
  }

  const writebackPayload = {
    writeback_version: '1.0.0',
    operation_id: `writeback-operation-${Date.now()}`,
    source_type: 'factory_execution',
    target_domain: 'process_runtime',
    target_ref: state.currentScenario.scenario_id,
    mutation_type: 'patch',
    payload: {
      status: 'synced',
      last_experience_ref: state.currentExperience.experience_id,
      last_workflow_ref: state.currentWorkflow.build_workflow_id,
      last_factory_execution_ref: state.currentFactoryOrchestration.execution_report.execution_id,
      factory_operation_log_refs: state.currentFactoryOrchestration.execution_report.operation_log_refs
    },
    trace: {
      scenario_ref: state.currentScenario.scenario_id,
      experience_ref: state.currentExperience.experience_id,
      workflow_ref: state.currentWorkflow.build_workflow_id
    },
    requested_at: new Date().toISOString()
  };

  const writebackResult = await postJson('/api/repository/writeback', writebackPayload);
  const logsResult = await fetchJson('/api/repository/writeback/logs?limit=5');

  state.currentWriteback = {
    request: writebackPayload,
    result: writebackResult,
    latest_logs: logsResult.items
  };
  state.activeTab = 'writeback';
  renderOutput();
}

async function handleFactoryOrchestration() {
  clearError();

  if (!state.currentScenario || !state.currentExperience) {
    setError('请先生成软件定义和表达，再执行工厂编排。');
    return;
  }

  const selectedObjectRefs = resolveFactoryObjectRefs();
  if (selectedObjectRefs.length === 0) {
    setError('请至少选择一个构建能力单元后，再执行工厂编排。');
    return;
  }

  const requestPayload = {
    request_id: `assembly-request-${Date.now()}`,
    scenario_ref: state.currentScenario.scenario_id,
    experience_ref: state.currentExperience.experience_id,
    selected_object_refs: selectedObjectRefs,
    constraints: {
      require_published: true,
      allow_deprecated: false
    }
  };

  const plan = await postJson('/api/factory/assembly/plan', requestPayload);
  const executionReport = await postJson('/api/factory/assembly/execute', {
    plan_id: plan.plan_id
  });

  state.currentFactoryOrchestration = {
    request: requestPayload,
    plan,
    execution_report: executionReport
  };
  state.activeTab = 'factory';
  renderOutput();
}

function fillIntentFields() {
  const { scenarioId, scenarioName, scenarioGoal, scenarioDescription, targetUsers } = getElements();
  const draft = state.bootstrap.scenarioDraft;
  const intent = state.bootstrap.softwareIntentTemplate;

  scenarioId.value = draft.scenario_id;
  scenarioName.value = intent.software_name;
  scenarioGoal.value = intent.usage_expectation;
  scenarioDescription.value = draft.description;
  targetUsers.value = intent.target_users;
}

function resetWorkbench() {
  state.selectedEntityRefs = new Set();
  state.selectedBusinessFlowRefs = new Set();
  state.selectedRelationshipViewIds = new Set();
  state.selectedFactoryCapabilityIds = new Set();
  state.currentScenario = null;
  state.currentExperience = null;
  state.currentWorkflow = null;
  state.currentFactoryOrchestration = null;
  state.currentWriteback = null;
  state.activeTab = 'scenario';
  clearError();

  fillIntentFields();
  renderWorkbench();
}

function renderWorkbench() {
  const elements = getElements();

  renderRepositoryMeta();
  renderStaticList(
    elements.stateCollectionList,
    state.bootstrap.stateCollections,
    '状态集合'
  );
  renderOptionList(
    elements.entityList,
    state.bootstrap.knowledge.entities,
    state.selectedEntityRefs,
    '实体'
  );
  renderOptionList(
    elements.flowList,
    state.bootstrap.knowledge.business_flows,
    state.selectedBusinessFlowRefs,
    '业务流程'
  );
  renderOptionList(
    elements.relationshipList,
    state.bootstrap.relationshipViews,
    state.selectedRelationshipViewIds,
    '关系视角'
  );
  renderOptionList(
    elements.factoryCapabilityList,
    state.bootstrap.factoryCapabilities,
    state.selectedFactoryCapabilityIds,
    '构建能力单元'
  );

  renderSelectionSummary();
  renderOutput();
  renderErrorBanner();
}

function bindEvents() {
  const elements = getElements();

  elements.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.tab;
      renderOutput();
    });
  });

  elements.generateScenarioButton.addEventListener('click', () => {
    handleGenerateScenario().catch((error) => setError(error.message));
  });

  elements.generateExperienceButton.addEventListener('click', () => {
    handleGenerateExperience().catch((error) => setError(error.message));
  });

  elements.recordWorkflowButton.addEventListener('click', () => {
    handleRecordWorkflow().catch((error) => setError(error.message));
  });

  elements.executeFactoryOrchestrationButton.addEventListener('click', () => {
    handleFactoryOrchestration().catch((error) => setError(error.message));
  });

  elements.executeWritebackButton.addEventListener('click', () => {
    handleExecuteWriteback().catch((error) => setError(error.message));
  });

  elements.resetButton.addEventListener('click', () => {
    resetWorkbench();
  });

  [
    elements.scenarioName,
    elements.scenarioGoal,
    elements.scenarioDescription,
    elements.targetUsers
  ].forEach((field) => {
    field.addEventListener('input', () => {
      renderSelectionSummary();
      renderOutput();
    });
  });
}

async function bootstrapWorkbench() {
  const response = await fetch('/api/workbench/bootstrap');
  state.bootstrap = await response.json();

  fillIntentFields();
  bindEvents();
  renderWorkbench();
}

bootstrapWorkbench().catch((error) => {
  state.errors = [error.message];
  renderErrorBanner();
  renderOutput();
});
