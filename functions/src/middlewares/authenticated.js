'use strict'

var { decode }  = require('jwt-simple');
var moment      = require('moment');
var secret      = 'parlamento-centroamericano-j$≠029:_≠2/$≠^1#l9k`';
var secret1     = 'parlamento-centroamericano-j$≠029:_≠2/$≠^1#l9k`';

/**
 * Ensure that the user is authenticated through JWT
 * @param {any} req Request body with all data
 * @param {any} res Request object to return a result
 * @param {void} next Method that will be executed
 */
exports.ensureAuth = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(404).send({ message: 'La petición no tiene la cabecera de autenticación' });
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');
    try {
        var payload = decode(token, secret);
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({ message: 'El token ha expirado' });
        }
    } catch (ex) {
        return res.status(403).send({ message: 'El token no es válido' });
    }
    req.user = payload;
    next();
}

exports.ensureUserAuth = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(404).send({ message: 'La petición no tiene la cabecera de autenticación' });
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');
    try {
        var payload = decode(token, secret1);
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({ message: 'El token ha expirado' });
        }
    } catch (ex) {
        return res.status(403).send({ message: 'El token no es válido' });
    }
    req.user = payload;
    next();
}