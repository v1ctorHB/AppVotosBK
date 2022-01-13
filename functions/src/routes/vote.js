'use strict';

const express           = require('express');
const voteController    = require('../controllers/vote');
const md_auth           = require('../middlewares/authenticated');
const api               = express.Router();

// ROUTES
api.post('/assembly/:id/points/:pId/votes',  md_auth.ensureAuth, voteController.voteForPoint);


// EXPORTS
module.exports = api;