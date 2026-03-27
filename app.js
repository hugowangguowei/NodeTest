'use strict';

const { start } = require('./src/index');

if (require.main === module) {
  start();
}

module.exports = { start };
