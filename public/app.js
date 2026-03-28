'use strict';

const state = {
  bootstrap: null,
  activeTab: 'scenario',
  selectedEntityRefs: new Set(),
  selectedBusinessFlowRefs: new Set(),
  selectedRelationshipViewIds: new Set(),
  currentScenario: null,
  currentExperience: null,
  currentWorkflow: null,
  errors: []
};

function getElements() {
  return {
    entityList: document.querySelector('[data-role="entity-list"]'),
    flowList: document.querySelector('[data-role="flow-list"]'),
    relationshipList: document.querySelector('[data-role="relationship-list"]'),
    selectedSummary: document.querySelector('[data-role="selected-summary"]'),
    outputShell: document.querySelector('[data-role="output-shell"]'),
    errorBanner: document.querySelector('[data-role="error-banner"]'),
    scenarioId: document.querySelector('[data-role="scenario-id"]'),
    scenarioName: document.querySelector('[data-role="scenario-name"]'),
    scenarioGoal: document.querySelector('[data-role="scenario-goal"]'),
    scenarioDescription: document.querySelector('[data-role="scenario-description"]'),
    tabs: Array.from(document.querySelectorAll('[data-role="tab"]')),
    generateScenarioButton: document.querySelector('[data-role="generate-scenario"]'),
    generateExperienceButton: document.querySelector('[data-role="generate-experience"]'),
    recordWorkflowButton: document.querySelector('[data-role="record-workflow"]'),
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
    });

    const meta = document.createElement('div');
    meta.className = 'option-meta';
    meta.innerHTML = `<strong>${item.name}</strong><span>${label}</span>`;

    wrapper.append(checkbox, meta);
    container.append(wrapper);
  });
}

function renderSelectionSummary() {
  const { selectedSummary } = getElements();

  selectedSummary.innerHTML = [
    `<span class="chip">场景：${getElements().scenarioName.value}</span>`,
    `<span class="chip">目标：${getElements().scenarioGoal.value}</span>`,
    `<span class="chip">已选实体：${state.selectedEntityRefs.size}</span>`,
    `<span class="chip">已选业务流程：${state.selectedBusinessFlowRefs.size}</span>`,
    `<span class="chip">已选关系视角：${state.selectedRelationshipViewIds.size}</span>`
  ].join('');
}

function getOutputPayload() {
  if (state.activeTab === 'scenario') {
    return state.currentScenario || { message: '尚未生成 Scenario' };
  }

  if (state.activeTab === 'experience') {
    return state.currentExperience || { message: '尚未生成 Experience' };
  }

  if (state.activeTab === 'workflow') {
    return state.currentWorkflow || { message: '尚未记录 Build Workflow' };
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

function buildScenarioSelection() {
  const { scenarioId, scenarioName, scenarioGoal, scenarioDescription } = getElements();

  return {
    scenario_id: scenarioId.value.trim(),
    name: scenarioName.value.trim(),
    goal: scenarioGoal.value.trim(),
    description: scenarioDescription.value.trim(),
    selected_entity_refs: Array.from(state.selectedEntityRefs),
    selected_behavior_refs: [],
    selected_event_refs: [],
    selected_relationship_refs: [],
    selected_business_flow_refs: Array.from(state.selectedBusinessFlowRefs),
    selected_rule_refs: [],
    relationship_views: state.bootstrap.relationshipViews.filter((item) =>
      state.selectedRelationshipViewIds.has(item.id)
    ),
    capabilities: [],
    boundaries: {},
    outputs: []
  };
}

function buildExperienceSelection() {
  const template = state.bootstrap.experienceTemplate;

  return {
    ...template,
    flow_projections: template.flow_projections.filter((item) =>
      state.selectedBusinessFlowRefs.has(item.business_flow_ref)
    ),
    relationship_projections: template.relationship_projections.filter((item) =>
      state.selectedRelationshipViewIds.has(item.relationship_view_ref)
    )
  };
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
    setError('请先生成场景，再生成表达。');
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
    setError('请先生成场景和表达，再记录构建流程。');
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

function resetWorkbench() {
  const { scenarioId, scenarioName, scenarioGoal, scenarioDescription } = getElements();
  const draft = state.bootstrap.scenarioDraft;

  scenarioId.value = draft.scenario_id;
  scenarioName.value = draft.name;
  scenarioGoal.value = draft.goal;
  scenarioDescription.value = draft.description;

  state.selectedEntityRefs = new Set();
  state.selectedBusinessFlowRefs = new Set();
  state.selectedRelationshipViewIds = new Set();
  state.currentScenario = null;
  state.currentExperience = null;
  state.currentWorkflow = null;
  state.activeTab = 'scenario';
  clearError();

  renderWorkbench();
}

function renderWorkbench() {
  const elements = getElements();

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

  elements.resetButton.addEventListener('click', () => {
    resetWorkbench();
  });

  [elements.scenarioName, elements.scenarioGoal].forEach((field) => {
    field.addEventListener('input', renderSelectionSummary);
  });
}

async function bootstrapWorkbench() {
  const response = await fetch('/api/workbench/bootstrap');
  state.bootstrap = await response.json();

  const { scenarioId, scenarioName, scenarioGoal, scenarioDescription } = getElements();
  const draft = state.bootstrap.scenarioDraft;

  scenarioId.value = draft.scenario_id;
  scenarioName.value = draft.name;
  scenarioGoal.value = draft.goal;
  scenarioDescription.value = draft.description;

  bindEvents();
  renderWorkbench();
}

bootstrapWorkbench().catch((error) => {
  state.errors = [error.message];
  renderErrorBanner();
  renderOutput();
});
