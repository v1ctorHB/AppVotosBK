'use strict';
const {
    USER_ROLES, USER_STATUS
}                   = require('../enums/user.enums');
const {
    getParsedElementFromDBById, getDocById, getCollection,
}                   = require('../services/base-firestore');
const {
    COLLECTIONS
}                   = require('../enums/db-collections.enums');
const Attendance    = require('../models/attendance');


const markAssistance = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let { forum } = req.body;
        let assemblyId = req.params.id;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        if (!assembly.isActive) {
            return res.status(403).send({ message: 'Active La Asamblea Para Continuar' });
        }
        if (!forum) {
            return res.status(404).send({ message: 'No Se Envió Forum' });
        }
        if (!forum.length) {
            return res.status(404).send({ message: 'No Se Envió Forum' });
        }
        await updateRecursiveCanVote(forum, true);
        let attendance = Attendance;
        attendance.assemblyId = assemblyId;
        attendance.forum = forum;
        let createdAttendance = await getCollection(COLLECTIONS.ATTENDANCE).add(attendance);
        if (!createdAttendance) {
            return res.status(500).send({ message: 'Ha Ocurrido Un Error Al Generar Asistencia' });
        }
        return res.status(200).send({ message: 'Se Ha Generado La Asistencia Correctamente' });

    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updateRecursiveCanVote = async (forum, canVote, index = 0) => {
    if (forum[index]) {
        if (forum[index].isPresent) {
            await getDocById(COLLECTIONS.USERS, forum[index].id).update({ canVote });
        }
        await updateRecursiveCanVote(forum, canVote, index + 1);
    }
}

/**
 * 
 * @param {string} role Role to validate if have Permissions
 * @returns {boolean} Return true if role has permissions and false if hasn´t it
 */
const validateRoles = role =>
    USER_ROLES.SYSTEMS === role ||
    USER_ROLES.ADMIN === role ||
    USER_ROLES.SUPER_ADMIN === role;


module.exports = {
    markAssistance,
    updateRecursiveCanVote,
}