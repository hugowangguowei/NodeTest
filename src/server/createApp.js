'use strict';

const path = require('path');
const express = require('express');
const { registerRoutes } = require('./routes');
const { resetWritebackStore } = require('../repository/unifiedWritebackStore');
const { resetFactoryStore } = require('../repository/factoryOrchestrationStore');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, '../../public')));
  resetWritebackStore();
  resetFactoryStore();
  registerRoutes(app);
  return app;
}

module.exports = { createApp };
