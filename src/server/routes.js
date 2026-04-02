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
