'use strict';

// IMPORTS
var express                  = require('express');
var attendanceController     = require('../controllers/attendance');
var md_auth                  = require('../middlewares/authenticated');
var api                      = express.Router();

// ROUTES

api.post('/admin/assemblies/:id/attendance', md_auth.ensureAuth, attendanceController.markAssistance);
api.get('/admin/assemblies/:id/reset', md_auth.ensureAuth, attendanceController.resetAssemblie);


// EXPORTS
module.exports = api;