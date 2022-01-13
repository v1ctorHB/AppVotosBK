'use strict';

// IMPORTS
var express         = require('express');
var user_controller = require('../controllers/user');
var md_auth         = require('../middlewares/authenticated');
var api             = express.Router();

// ROUTES
api.post('/users',                  user_controller.createUserFromWeb);
api.get('/users/logged',            md_auth.ensureAuth, user_controller.getLoggedUser);
api.post('/admin/users',            md_auth.ensureAuth, user_controller.createUser);
api.put('/admin/users/:id',         md_auth.ensureAuth, user_controller.updateUser);
api.delete('/admin/users/:id',      md_auth.ensureAuth, user_controller.deleteUser);
api.get('/admin/users/:id',         md_auth.ensureAuth, user_controller.getUser);
api.get('/admin/users',             md_auth.ensureAuth, user_controller.listUsers);
api.put('/admin/users/:id/status',  md_auth.ensureAuth, user_controller.updateUserStatus);
api.get('/admin/attendance/users',  md_auth.ensureAuth, user_controller.listUsersForAttendance);

api.post('/auth/login',         user_controller.login);

// EXPORTS
module.exports = api;