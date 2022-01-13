'use strict';

const functions = require('firebase-functions');
const appExport = require('./src/app');

exports.voting = functions.https.onRequest(appExport);