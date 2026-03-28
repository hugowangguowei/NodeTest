'use strict';

async function bootstrapWorkbench() {
  const response = await fetch('/api/workbench/bootstrap');
  const data = await response.json();

  const entityList = document.querySelector('[data-role="entity-list"]');
  const flowList = document.querySelector('[data-role="flow-list"]');
  const relationshipList = document.querySelector('[data-role="relationship-list"]');
  const selectedSummary = document.querySelector('[data-role="selected-summary"]');
  const outputShell = document.querySelector('[data-role="output-shell"]');

  entityList.innerHTML = data.knowledge.entities
    .map((item) => `<span class="chip">${item.name}</span>`)
    .join('');

  flowList.innerHTML = data.knowledge.business_flows
    .map((item) => `<span class="chip">${item.name}</span>`)
    .join('');

  relationshipList.innerHTML = data.relationshipViews
    .map((item) => `<span class="chip">${item.name}</span>`)
    .join('');

  selectedSummary.innerHTML = [
    `<span class="chip">场景：${data.scenarioDraft.name}</span>`,
    `<span class="chip">目标：${data.scenarioDraft.goal}</span>`,
    '<span class="chip">已选实体：0</span>',
    '<span class="chip">已选业务流程：0</span>',
    '<span class="chip">已选关系视角：0</span>'
  ].join('');

  outputShell.textContent = JSON.stringify(
    {
      bootstrapLoaded: true,
      knowledgeId: data.knowledge.knowledge_id,
      scenarioDraft: data.scenarioDraft,
      experienceTemplateId: data.experienceTemplate.experience_id
    },
    null,
    2
  );
}

bootstrapWorkbench().catch((error) => {
  const outputShell = document.querySelector('[data-role="output-shell"]');
  outputShell.textContent = JSON.stringify(
    {
      error: error.message
    },
    null,
    2
  );
});
