'use strict';

const Ajv = require('ajv');
const schemas = require('../contracts');

const ajv = new Ajv({ allErrors: true });

ajv.addSchema(schemas.standardKnowledge, 'standardKnowledge');
ajv.addSchema(schemas.scenario, 'scenario');
ajv.addSchema(schemas.experience, 'experience');
ajv.addSchema(schemas.buildWorkflow, 'buildWorkflow');

const validators = {
  standardKnowledge: ajv.getSchema('standardKnowledge'),
  scenario: ajv.getSchema('scenario'),
  experience: ajv.getSchema('experience'),
  buildWorkflow: ajv.getSchema('buildWorkflow')
};

module.exports = { validators };
