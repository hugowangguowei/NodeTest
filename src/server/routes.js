'use strict';

const { getWorkbenchBootstrap } = require('../sampleData/workbenchBootstrap');
const { validators } = require('../validation/compileValidators');
const { composeScenario } = require('../domain/composeScenario');
const { createExperience } = require('../domain/createExperience');
const { createBuildWorkflow } = require('../domain/createBuildWorkflow');

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
}

module.exports = { registerRoutes };
