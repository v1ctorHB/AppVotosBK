const admin     = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firestore);

let db = admin.firestore();

module.exports = db;