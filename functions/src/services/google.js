const admin     = require('firebase-admin');
const functions = require('firebase-functions');
const firebaseApp = require('firebase/app');
const firebaseAuth = require('firebase/auth');

const serviceAccount = require('../credenciales.json');

const configDb = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const config = {
    apiKey: "AIzaSyB8HDdIlRXadKE5KNRceTVoJguyZr8_aDE",
    authDomain: "votaciones-parlacen.firebaseapp.com",
    projectId: "votaciones-parlacen",
    storageBucket: "votaciones-parlacen.appspot.com",
    messagingSenderId: "843020707924",
    appId: "1:843020707924:web:6caaaa66bbc75b764765c1",
    measurementId: "G-6G777K3K9E"
};
const appFirebase = firebaseApp.initializeApp(config);


let db = admin.firestore();

module.exports = {
    db,
    configDb,
    appFirebase,
    firebaseAuth
};