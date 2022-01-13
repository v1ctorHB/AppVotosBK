'use strict';

// IMPORTS
var express                 = require('express');
var assemblyPointController = require('../controllers/assembly-point');
var md_auth                 = require('../middlewares/authenticated');
var api                     = express.Router();

// ROUTES
api.post('/admin/assemblies/:id/points',              md_auth.ensureAuth, assemblyPointController.createPoint);
api.put('/admin/assemblies/:id/points/:pId',          md_auth.ensureAuth, assemblyPointController.updatePoint);
api.delete('/admin/assemblies/:id/points/:pId',       md_auth.ensureAuth, assemblyPointController.deletePoint);
api.get('/admin/assemblies/:id/points/:pId',          md_auth.ensureAuth, assemblyPointController.getPointById);
api.get('/admin/assemblies/:id/points',               md_auth.ensureAuth, assemblyPointController.listPointsByAssemblyId);
api.put('/admin/assemblies/:id/points/:pId/status',   md_auth.ensureAuth, assemblyPointController.updatePointStatus);

api.get('/assemblies/:id/points/:pId',                md_auth.ensureAuth, assemblyPointController.getActivePointById);
api.get('/assemblies/:id/points',                     md_auth.ensureAuth, assemblyPointController.listPointsByActiveAssemblyById);

// EXPORTS
module.exports = api;