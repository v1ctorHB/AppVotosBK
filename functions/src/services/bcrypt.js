'use strict';
const { hash, compare } = require('bcrypt');

/**
 * Functions that hash string and return it *
 * @param {string} field string to be hashed *
 * @returns {Promise<String>} A promise to be either resolved with de hash result or reject with an error */
const hashField = async field => await hash(field, 12);

/**
 * Validate if plain string is same that hashed string * 
 * @param {string} field string to be compared with hashed string *
 * @param {string} hashedField string hashed needed to compare *
 * @returns {Promise<boolean>} A promise to be either resolved with de comparison result or reject with an error */
const compareWithHashed = async (field, hashedField) => await compare(field, hashedField);

module.exports = {
    hashField,
    compareWithHashed
};