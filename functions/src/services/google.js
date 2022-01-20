const admin     = require('firebase-admin');
const functions = require('firebase-functions');

const serviceAccount = require('../credenciales.json');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

let db = admin.firestore();

module.exports = db;