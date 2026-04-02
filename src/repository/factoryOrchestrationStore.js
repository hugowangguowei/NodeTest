'use strict';

const STAGE_WEIGHT = {
  definition: 1,
  assembly: 2,
  runtime: 3,
  governance: 4
};

const ACTION_BY_KIND = {
  skill: 'validate',
  plugin: 'integrate',
  template: 'compose',
  component: 'compose',
  rule_pack: 'validate',
  connector: 'integrate'
};

const DEFAULT_OBJECTS = [
  {
    object_id: 'factory-object-001',
    name: '工作流 Skill',
    kind: 'skill',
    form: 'package',
    stage: 'definition',
    lifecycle_status: 'published',
    io_contract_ref: 'io-contract-001',
    dependency_contract: {
      required_refs: [],
      optional_refs: []
    },
    replaceability_level: 'hot_swappable',
    contract_version: '1.0.0'
  },
  {
    object_id: 'factory-object-002',
    name: '界面模板组件',
    kind: 'template',
    form: 'config',
    stage: 'assembly',
    lifecycle_status: 'published',
    io_contract_ref: 'io-contract-002',
    dependency_contract: {
      required_refs: ['factory-object-001'],
      optional_refs: []
    },
    replaceability_level: 'cold_swappable',
    contract_version: '1.0.0'
  },
  {
    object_id: 'factory-object-003',
    name: '消息联动插件',
    kind: 'plugin',
    form: 'script',
    stage: 'runtime',
    lifecycle_status: 'published',
    io_contract_ref: 'io-contract-003',
    dependency_contract: {
      required_refs: ['factory-object-002'],
      optional_refs: []
    },
    replaceability_level: 'hot_swappable',
    contract_version: '1.0.0'
  },
  {
    object_id: 'factory-object-004',
    name: '审批规则包',
    kind: 'rule_pack',
    form: 'schema',
    stage: 'governance',
    lifecycle_status: 'draft',
    io_contract_ref: 'io-contract-004',
    dependency_contract: {
      required_refs: ['factory-object-001'],
      optional_refs: []
    },
    replaceability_level: 'cold_swappable',
    contract_version: '1.0.0'
  }
];

const store = {
  objects: [],
  plans: new Map(),
  planCounter: 0,
  executionCounter: 0
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resetFactoryStore() {
  store.objects = clone(DEFAULT_OBJECTS);
  store.plans = new Map();
  store.planCounter = 0;
  store.executionCounter = 0;
}

function ensureInitialized() {
  if (store.objects.length === 0) {
    resetFactoryStore();
  }
}

function listFactoryObjects(filters = {}) {
  ensureInitialized();
  const { kind, stage, lifecycle_status } = filters;

  const items = store.objects.filter((item) => {
    if (kind && item.kind !== kind) {
      return false;
    }

    if (stage && item.stage !== stage) {
      return false;
    }

    if (lifecycle_status && item.lifecycle_status !== lifecycle_status) {
      return false;
    }

    return true;
  });

  return clone(items);
}

function getObjectById(objectId) {
  ensureInitialized();
  return store.objects.find((item) => item.object_id === objectId) || null;
}

function getObjectsByRefs(objectRefs) {
  return objectRefs
    .map((ref) => getObjectById(ref))
    .filter(Boolean);
}

function checkCompatibility(objectRefs, constraints = {}) {
  ensureInitialized();
  const normalizedRefs = Array.from(new Set(objectRefs || []));
  const requirePublished = constraints.require_published !== false;
  const allowDeprecated = constraints.allow_deprecated === true;
  const conflicts = [];

  for (const ref of normalizedRefs) {
    const targetObject = getObjectById(ref);

    if (!targetObject) {
      conflicts.push({
        code: 'factory_object_not_found',
        object_ref: ref,
        message: `对象不存在: ${ref}`
      });
      continue;
    }

    if (
      requirePublished &&
      targetObject.lifecycle_status !== 'published' &&
      !(allowDeprecated && targetObject.lifecycle_status === 'deprecated')
    ) {
      conflicts.push({
        code: 'factory_object_not_published',
        object_ref: ref,
        message: `对象未发布: ${ref}`
      });
    }

    if (!allowDeprecated && targetObject.lifecycle_status === 'deprecated') {
      conflicts.push({
        code: 'factory_object_not_published',
        object_ref: ref,
        message: `对象已废弃: ${ref}`
      });
    }
  }

  for (const targetObject of getObjectsByRefs(normalizedRefs)) {
    const requiredRefs = targetObject.dependency_contract.required_refs || [];
    const missedRefs = requiredRefs.filter((ref) => !normalizedRefs.includes(ref));

    for (const missedRef of missedRefs) {
      conflicts.push({
        code: 'factory_dependency_conflict',
        object_ref: targetObject.object_id,
        dependency_ref: missedRef,
        message: `对象 ${targetObject.object_id} 缺少必需依赖 ${missedRef}`
      });
    }
  }

  return {
    compatible: conflicts.length === 0,
    conflicts
  };
}

function hasDependencyCycle(selectedRefs) {
  const selectedSet = new Set(selectedRefs);
  const visiting = new Set();
  const visited = new Set();

  function visit(ref) {
    if (visited.has(ref)) {
      return false;
    }

    if (visiting.has(ref)) {
      return true;
    }

    visiting.add(ref);
    const targetObject = getObjectById(ref);
    const requiredRefs = (targetObject?.dependency_contract?.required_refs || []).filter((dep) =>
      selectedSet.has(dep)
    );

    for (const dep of requiredRefs) {
      if (visit(dep)) {
        return true;
      }
    }

    visiting.delete(ref);
    visited.add(ref);
    return false;
  }

  for (const ref of selectedRefs) {
    if (visit(ref)) {
      return true;
    }
  }

  return false;
}

function sortByStageAndId(a, b) {
  const stageDiff = (STAGE_WEIGHT[a.stage] || 99) - (STAGE_WEIGHT[b.stage] || 99);
  if (stageDiff !== 0) {
    return stageDiff;
  }

  return a.object_id.localeCompare(b.object_id, 'en');
}

function topologicalSort(selectedRefs) {
  const selectedSet = new Set(selectedRefs);
  const indegree = new Map();
  const edges = new Map();

  for (const ref of selectedRefs) {
    indegree.set(ref, 0);
    edges.set(ref, []);
  }

  for (const ref of selectedRefs) {
    const currentObject = getObjectById(ref);
    const requiredRefs = (currentObject?.dependency_contract?.required_refs || []).filter((dep) =>
      selectedSet.has(dep)
    );

    for (const dep of requiredRefs) {
      edges.get(dep).push(ref);
      indegree.set(ref, (indegree.get(ref) || 0) + 1);
    }
  }

  const ordered = [];
  const queue = selectedRefs
    .filter((ref) => indegree.get(ref) === 0)
    .map((ref) => getObjectById(ref))
    .filter(Boolean)
    .sort(sortByStageAndId);

  while (queue.length > 0) {
    const current = queue.shift();
    ordered.push(current.object_id);

    const nextRefs = edges.get(current.object_id) || [];
    for (const nextRef of nextRefs) {
      indegree.set(nextRef, (indegree.get(nextRef) || 0) - 1);
      if (indegree.get(nextRef) === 0) {
        const nextObject = getObjectById(nextRef);
        if (nextObject) {
          queue.push(nextObject);
          queue.sort(sortByStageAndId);
        }
      }
    }
  }

  return ordered;
}

function createAssemblyPlan(requestPayload) {
  ensureInitialized();
  const selectedRefs = Array.from(new Set(requestPayload.selected_object_refs || []));
  const compatibility = checkCompatibility(selectedRefs, requestPayload.constraints || {});

  if (!compatibility.compatible) {
    const error = new Error('factory_dependency_conflict');
    error.code = 'factory_dependency_conflict';
    error.details = compatibility.conflicts;
    throw error;
  }

  if (hasDependencyCycle(selectedRefs)) {
    const error = new Error('factory_plan_cycle_detected');
    error.code = 'factory_plan_cycle_detected';
    error.details = [];
    throw error;
  }

  store.planCounter += 1;
  const planId = `assembly-plan-${store.planCounter}`;
  const orderedRefs = topologicalSort(selectedRefs);
  const planSteps = orderedRefs.map((objectRef, index) => {
    const targetObject = getObjectById(objectRef);

    return {
      step_id: `step-${String(index + 1).padStart(3, '0')}`,
      object_ref: objectRef,
      action: ACTION_BY_KIND[targetObject.kind] || 'compose',
      stage: targetObject.stage
    };
  });

  const stepRefMap = new Map(planSteps.map((step) => [step.object_ref, step.step_id]));
  const dependencyEdges = [];

  for (const objectRef of orderedRefs) {
    const targetObject = getObjectById(objectRef);
    const requiredRefs = targetObject.dependency_contract.required_refs || [];
    const optionalRefs = targetObject.dependency_contract.optional_refs || [];

    for (const requiredRef of requiredRefs) {
      if (stepRefMap.has(requiredRef) && stepRefMap.has(objectRef)) {
        dependencyEdges.push({
          from_step_ref: stepRefMap.get(requiredRef),
          to_step_ref: stepRefMap.get(objectRef),
          dependency_type: 'hard'
        });
      }
    }

    for (const optionalRef of optionalRefs) {
      if (stepRefMap.has(optionalRef) && stepRefMap.has(objectRef)) {
        dependencyEdges.push({
          from_step_ref: stepRefMap.get(optionalRef),
          to_step_ref: stepRefMap.get(objectRef),
          dependency_type: 'soft'
        });
      }
    }
  }

  const plan = {
    plan_id: planId,
    request_ref: requestPayload.request_id,
    plan_steps: planSteps,
    dependency_edges: dependencyEdges,
    validation_result: {
      status: 'ok',
      issues: []
    },
    fallback_strategy: 'stop_on_error'
  };

  store.plans.set(planId, clone(plan));
  return clone(plan);
}

function executeAssemblyPlan({ plan_id, assembly_plan }) {
  ensureInitialized();
  const plan = plan_id ? store.plans.get(plan_id) : assembly_plan;

  if (!plan) {
    const error = new Error('factory_plan_not_found');
    error.code = 'factory_plan_not_found';
    throw error;
  }

  store.executionCounter += 1;
  const executionId = `assembly-exec-${store.executionCounter}`;
  const stepResults = [];
  const operationLogRefs = [];

  for (const step of plan.plan_steps || []) {
    stepResults.push({
      step_ref: step.step_id,
      status: 'success',
      message: `executed:${step.action}`
    });

    operationLogRefs.push(`factory-oplog-${store.executionCounter}-${step.step_id}`);
  }

  return {
    execution_id: executionId,
    plan_ref: plan.plan_id || plan_id,
    step_results: stepResults,
    warnings: [],
    errors: [],
    operation_log_refs: operationLogRefs,
    finished_at: new Date().toISOString()
  };
}

function publishFactoryObjects(objectRefs, targetStatus = 'published') {
  ensureInitialized();
  const refs = Array.from(new Set(objectRefs || []));
  const updatedRefs = [];
  const notFoundRefs = [];

  for (const ref of refs) {
    const targetObject = getObjectById(ref);
    if (!targetObject) {
      notFoundRefs.push(ref);
      continue;
    }

    targetObject.lifecycle_status = targetStatus;
    updatedRefs.push(ref);
  }

  return {
    updated_refs: updatedRefs,
    not_found_refs: notFoundRefs,
    target_lifecycle_status: targetStatus
  };
}

module.exports = {
  resetFactoryStore,
  listFactoryObjects,
  checkCompatibility,
  createAssemblyPlan,
  executeAssemblyPlan,
  publishFactoryObjects
};
