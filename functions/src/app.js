'use strict';

// PACKAGES
const express       = require('express');
const app           = express();
const cors          = require('cors');
// P: CONTROLLERS
var user_controller = require('./controllers/user');
// P: ROUTES
var user_route          = require('./routes/user');
var point_route         = require('./routes/assembly-point');
var vote_route          = require('./routes/vote');
var assemblies_route    = require('./routes/assembly');
var attendance_route    = require('./routes/attendance');

// MIDDLEWWARES
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

user_controller.createDefaultadmin().then(() => {});

// ROUTES
app.use('/api', user_route);
app.use('/api', point_route);
app.use('/api', vote_route); 
app.use('/api', assemblies_route);
app.use('/api', attendance_route);


// EXPORT
module.exports = app;