'use strict';

const {db} = require('../services/google');

/**
 * Get parsed document by id as model
 * @param {string} collectionName Name of collection where is the document
 * @param {string} docId Id of User that will be returned
 * @returns User parsed
 */
const getParsedElementFromDBById = async (collectionName, docId) => {
    let user = await getDocById(collectionName, docId).get();
    return parseDocSnapshot(user);
};

/**
 * Get parsed docs as Array
 * @param {string} collectionName Name of collection where are the documents
 * @returns {Promise<any[]>} Promise to be either resolve with the parsed docs
 */
const getAllParsedElementsFromDB = async (collectionName) => {
    let objects = await getCollection(collectionName).get();
    return parseQuerySnapshot(objects);
};

/**
 * Parse snapshot as model array
 * @param {FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>} snapshot Firebase Snapshot that will be parsed
 * @returns Parsed array
 */
const parseQuerySnapshot = snapshot => {
    return snapshot.docs.map((element) => {
        return { id: element.id, ...element.data() };
    });
}

/**
 * Parse doc as model
 * @param {FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>} snapshot Firebase Snapshot that will be parsed
 * @returns Parsed object
 */
const parseDocSnapshot = snapshot => {
    return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Get Document from Firebase
 * @param {string} collectionName Name of collection where is the document
 * @param {string} docId Id of doc that will be returned
 * @returns {FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>} Document obtained from Firebase
 */
const getDocById = (collectionName, docId) => getCollection(collectionName).doc(docId);

/**
 * Get Collection from Firebase
 * @param {string} collectionName 
 * @returns {FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>} Collection
 */
const getCollection = collectionName => db.collection(collectionName);

module.exports = {
    parseQuerySnapshot,
    getDocById,
    getCollection,
    getAllParsedElementsFromDB,
    getParsedElementFromDBById,
}