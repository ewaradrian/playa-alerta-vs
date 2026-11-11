/**
 * api/index.js
 * Entrypoint de función Serverless para Vercel.
 * Exporta la aplicación Express principal hacia el runtime de Vercel.
 */

'use strict';

const app = require('../server.js');

module.exports = app;
