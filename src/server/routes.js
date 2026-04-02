'use strict';

const { getWorkbenchBootstrap } = require('../sampleData/workbenchBootstrap');
const { validators } = require('../validation/compileValidators');
const { composeScenario } = require('../domain/composeScenario');
const { createExperience } = require('../domain/createExperience');
const { createBuildWorkflow } = require('../domain/createBuildWorkflow');
const {
  applyWriteback,
  getWritebackLogs,
  getWritebackSnapshot
} = require('../repository/unifiedWritebackStore');
const {
  listFactoryObjects,
  checkCompatibility,
  createAssemblyPlan,
  executeAssemblyPlan,
  publishFactoryObjects
} = require('../repository/factoryOrchestrationStore');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function registerRoutes(app) {
  app.get('/api/workbench/bootstrap', (_req, res) => {
    res.json(getWorkbenchBootstrap());
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/validate/standard-knowledge', (req, res) => {
    const valid = validators.standardKnowledge(req.body);

    if (!valid) {
      return res.status(400).json({ errors: validators.standardKnowledge.errors });
    }

    return res.json({ status: 'valid' });
  });

  app.post('/api/scenarios/compose', (req, res) => {
    const scenario = composeScenario(req.body);
    return res.json(scenario);
  });

  app.post('/api/experiences/create', (req, res) => {
    const experience = createExperience(req.body);
    return res.json(experience);
  });

  app.post('/api/build-workflows/create', (req, res) => {
    const workflow = createBuildWorkflow(req.body);
    return res.json(workflow);
  });

  app.get('/api/factory/catalog', (req, res) => {
    const filters = {};

    if (isNonEmptyString(req.query.kind)) {
      filters.kind = String(req.query.kind);
    }

    if (isNonEmptyString(req.query.stage)) {
      filters.stage = String(req.query.stage);
    }

    if (isNonEmptyString(req.query.lifecycle_status)) {
      filters.lifecycle_status = String(req.query.lifecycle_status);
    } else if (String(req.query.include_all || 'false') !== 'true') {
      filters.lifecycle_status = 'published';
    }

    const items = listFactoryObjects(filters);
    return res.json({ items, total: items.length });
  });

  app.post('/api/factory/compatibility/check', (req, res) => {
    const payload = req.body || {};

    if (!Array.isArray(payload.object_refs)) {
      return res.status(400).json({
        code: 'invalid_payload',
        message: 'object_refs must be an array'
      });
    }

    const result = checkCompatibility(payload.object_refs, payload.constraints || {});
    return res.json(result);
  });

  app.post('/api/factory/assembly/plan', (req, res) => {
    const payload = req.body || {};

    if (
      !isNonEmptyString(payload.request_id) ||
      !isNonEmptyString(payload.scenario_ref) ||
      !isNonEmptyString(payload.experience_ref) ||
      !Array.isArray(payload.selected_object_refs) ||
      payload.selected_object_refs.length === 0
    ) {
      return res.status(400).json({
        code: 'invalid_payload',
        message: 'request_id/scenario_ref/experience_ref/selected_object_refs are required'
      });
    }

    try {
      const plan = createAssemblyPlan(payload);
      return res.json(plan);
    } catch (error) {
      if (
        error.code === 'factory_dependency_conflict' ||
        error.code === 'factory_plan_cycle_detected'
      ) {
        return res.status(409).json({
          code: error.code,
          conflicts: error.details || []
        });
      }

      throw error;
    }
  });

  app.post('/api/factory/assembly/execute', (req, res) => {
    const payload = req.body || {};

    if (!isNonEmptyString(payload.plan_id) && typeof payload.assembly_plan !== 'object') {
      return res.status(400).json({
        code: 'invalid_payload',
        message: 'plan_id or assembly_plan is required'
      });
    }

    try {
      const report = executeAssemblyPlan(payload);
      return res.json(report);
    } catch (error) {
      if (error.code === 'factory_plan_not_found') {
        return res.status(404).json({
          code: error.code,
          message: 'assembly plan not found'
        });
      }

      throw error;
    }
  });

  app.post('/api/factory/publish', (req, res) => {
    const payload = req.body || {};

    if (!Array.isArray(payload.object_refs) || payload.object_refs.length === 0) {
      return res.status(400).json({
        code: 'invalid_payload',
        message: 'object_refs must be a non-empty array'
      });
    }

    const targetStatus = isNonEmptyString(payload.target_lifecycle_status)
      ? payload.target_lifecycle_status
      : 'published';
    const result = publishFactoryObjects(payload.object_refs, targetStatus);
    return res.json(result);
  });

  app.post('/api/repository/writeback', (req, res) => {
    const valid = validators.writebackRequest(req.body);

    if (!valid) {
      return res.status(400).json({ errors: validators.writebackRequest.errors });
    }

    const result = applyWriteback(req.body);
    return res.json(result);
  });

  app.get('/api/repository/writeback/logs', (req, res) => {
    const parsedLimit = Number.parseInt(String(req.query.limit || '20'), 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    return res.json({
      items: getWritebackLogs(limit)
    });
  });

  app.get('/api/repository/writeback/snapshot', (_req, res) => {
    return res.json(getWritebackSnapshot());
  });
}

module.exports = { registerRoutes };
