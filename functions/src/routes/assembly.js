'use strict';

// IMPORTS
var express             = require('express');
var assemblyController  = require('../controllers/assembly');
var md_auth             = require('../middlewares/authenticated');
var api                 = express.Router();

// ROUTES
api.post('/admin/assemblies',           md_auth.ensureAuth, assemblyController.createAssembly);
api.put('/admin/assemblies/:id',        md_auth.ensureAuth, assemblyController.updateAssembly);
api.put('/admin/assemblies/:id/status', md_auth.ensureAuth, assemblyController.updateAssemblyStatus);
api.delete('/admin/assemblies/:id',     md_auth.ensureAuth, assemblyController.deleteAssembly);
api.get('/admin/assemblies/:id',        md_auth.ensureAuth, assemblyController.getAssemblyById);
api.get('/admin/assemblies',            md_auth.ensureAuth, assemblyController.listAssemblies);

// api votantes
api.get('/assemblies/active',           md_auth.ensureAuth, assemblyController.getActiveAssembly);
api.post('/assemblies/changeShowPoints/:idAssembly', md_auth.ensureAuth, assemblyController.changeShowPoints);
api.post('/assemblies/changeMultiPoints/:idAssembly', md_auth.ensureAuth, assemblyController.multiPointAssembly);
api.put('/assemblies/updateShowById/:idPoint', md_auth.ensureAuth, assemblyController.updateShowById);

// EXPORTS
module.exports = api;
