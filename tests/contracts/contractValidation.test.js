'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const standardKnowledge = require('../fixtures/standardKnowledge.valid.json');
const { validators } = require('../../src/validation/compileValidators');

test('standard knowledge fixture passes schema validation', () => {
  const valid = validators.standardKnowledge(standardKnowledge);

  assert.equal(valid, true);
});
