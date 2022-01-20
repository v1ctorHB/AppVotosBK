'use strict';

const Vote                          = require('../models/vote');
const {
    getCollection, getDocById, getParsedElementFromDBById
}                                   = require('../services/base-firestore');
const { USER_ROLES, USER_STATUS }   = require('../enums/user.enums');
const { COLLECTIONS }               = require('../enums/db-collections.enums');
const { VOTE_TYPE }                 = require('../enums/vote.enums');

// --------------------------------------- USER FUNCTIONS ---------------------------------------

const voteForPoint = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(404).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (userReq.role != USER_ROLES.DEPUTY || userReq.role == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId  = req.params.id;
        let pointId     = req.params.pId;
        let assembly    = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encotrada' });
        }
        if (!assembly.isActive) {
            return res.status(404).send({ message: 'Asamblea Desactivada' });
        }
        let point = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        if (!point.id) {
            return res.status(404).send({ message: 'Punto De Asamblea No Encontrado' });
        }
        if (!point.isActive) {
            return res.status(404).send({ message: 'Punto De Asamblea Desactivada' });
        }
        let voteExist = await getCollection(COLLECTIONS.VOTES)
            .where('assemblyPtId', '==', assemblyId)
            .where('pointId', '==', pointId)
            .where('userId', '==', userReq.id).get();
        if (voteExist.size) {
            return res.status(403).send({ message: 'Ya Hay Un Voto Con Este Usuario' });
        }
        // se obtiene el tipo del voto a realizar
        let params = req.body;
        if (!areMissingParams(params.type)) {
            return res.status(404).send({ message: 'Faltan Campos Principales' });
        }
        let createdVote = await createVote({ type: params.type, pointId: pointId, userId: userReq.id, assemblyPointId: assemblyId });
        let newVote     = await getParsedElementFromDBById(COLLECTIONS.VOTES, createdVote.id);
        if (!newVote) {
            return res.status(500).send({ message: 'Error Al Cargar Voto' });
        }
        let objToUpdate = {};
        objToUpdate.inFavor     = params.type === VOTE_TYPE.IN_FAVOR ? point.inFavor + 1 : point.inFavor;
        objToUpdate.nay         = params.type === VOTE_TYPE.OPOSSITE ? point.nay + 1 : point.nay;
        objToUpdate.abstinence  = params.type === VOTE_TYPE.BLANK ? point.abstinence + 1 : point.abstinence;
        
        let updatedPoint = await getDocById(COLLECTIONS.POINTS, pointId).update(objToUpdate);
        if (!updatedPoint) {
            return res.status(500).send({ message: 'Error Realizando Voto' });
        }
        return res.status(200).send({ message: 'Voto Realizado Correctamente' });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const createVote = vote => {
    let voteToCreate = Vote;
    voteToCreate.type = vote.type;
    voteToCreate.assemblyPtId = vote.assemblyPointId;
    voteToCreate.pointId = vote.pointId;
    voteToCreate.userId = vote.userId;
    return getCollection(COLLECTIONS.VOTES).add(voteToCreate);
}

/**
 * Validate if are missing params
 * @param {any} params user params
 * @returns {boolean} Return true if are missing params and false if all params exists
 */
const areMissingParams = params =>
    !params.type;

module.exports =  {
    voteForPoint
}
