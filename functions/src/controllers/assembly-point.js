'use strict';

const Point                         = require('../models/assembly-point');
const {
    getCollection, getDocById, getParsedElementFromDBById, parseQuerySnapshot,
}                                   = require('../services/base-firestore');
const { USER_ROLES, USER_STATUS }   = require('../enums/user.enums');
const { COLLECTIONS }               = require('../enums/db-collections.enums');

// --------------------------------------- ADMIN FUNCTIONS ---------------------------------------

const createPoint = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let params = req.body;
        let assemblyId = req.params.id;
        if (areMissingParams(params)) {
            return res.status(400).send({ message: 'Faltan Campos Principales' });
        }
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(400).send({ message: 'Asamblea No Encontrada' });
        }
        let point = Point;
        point.name          = params.name;
        point.description   = params.description;
        point.file          = params.file || '';
        point.image         = params.image || '';
        point.assemblyId    = assembly.id;
        point.inFavor       = 0;
        point.nay           = 0;
        point.abstinence    = 0;
        point.isActive      = false;
        let createdPoint    = await getCollection(COLLECTIONS.POINTS).add(point);
        let newPoint        = await getParsedElementFromDBById(COLLECTIONS.POINTS, createdPoint.id);

        return res.status(200).send({ message: 'Punto De La Asamblea Creado Exitosamente', point: newPoint });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updatePoint = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let assemblyId = req.params.id;
        let pointId = req.params.pId;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        let point2Update = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        if (!point2Update) {
            return res.status(404).send({ message: 'Punto De Asamblea No Encontrado' });
        }

        let params = req.body;
        let object2Update = {};
        if (params.name != null)        object2Update.name = params.name;
        if (params.description != null) object2Update.description = params.description;
        if (params.file != null)        object2Update.file = params.file;
        if (params.image != null)       object2Update.image = params.image;

        let updatedPoint = await getDocById(COLLECTIONS.POINTS, point2Update.id).update(object2Update);
        if (!updatedPoint) {
            return res.status(500).send({ message: 'Error Actualizando Punto De Asamblea' });
        }
        let point = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        return res.status(200).send({ message: 'Punto De Asamblea Actualizado Exitosamente', point });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const deletePoint = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId = req.params.id;
        let pointId = req.params.pId;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        let point2Delete = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        if (!point2Delete) {
            return res.status(404).send({ message: 'Punto De Asamblea No Encontrado' });
        }
        await getDocById(COLLECTIONS.POINTS, pointId).delete();
        return res.status(200).send({ message: 'Punto De Asamblea Eliminado Exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const getPointById = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let assemblyId = req.params.id;
        let pointId = req.params.pId;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        let point = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        if (!point) {
            return res.status(404).send({ message: 'Punto De Asamblea No Encontrado' });
        }
        return res.status(200).send({ message: 'Punto de Asamblea obtenido exitosamente', point });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const listPointsByAssemblyId = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let assemblyId = req.params.id;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        let pointsSnap = await getCollection(COLLECTIONS.POINTS).where('assemblyId', '==', assemblyId).get();
        let points = parseQuerySnapshot(pointsSnap);
        if (!points) {
            return res.status(404).send({ message: 'Puntos De Asamblea No Encontrados' });
        }
        return res.status(200).send({ message: 'Puntos De Asamblea Listados Exitosamente', points });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updatePointStatus = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let assemblyId = req.params.id;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        if (!assembly.isActive) {
            return res.status(403).send({ message: 'Asamblea Deshabilitada' });
        }
        let pointId = req.params.pId;
        let point2Up = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        if (!point2Up) {
            return res.status(404).send({ message: 'Punto De Asamblea No Encontrado' });
        }
        if (!req.body.isActive) {
            let objToUpdate = {};
            objToUpdate.isActive = req.body.isActive;
            let snap = await getCollection(COLLECTIONS.ATTENDANCE).where('assemblyId', '==', assemblyId).get();
            if (snap.docs.length > 0) {
                let attendance = parseQuerySnapshot(snap);
                let presentForum = attendance.filter(attend => attend.isPresent);
                objToUpdate.abstinence = presentForum - (point2Up.inFavor + point2Up.nay);
            }
            let updatedPoint = await getDocById(COLLECTIONS.POINTS, pointId).update(objToUpdate);
            if (!updatedPoint) {
                return res.status(500).send({ message: 'Error Actualizando Punto' });
            }
        } else {
            if (point2Up.inFavor) {
                return res.status(400).send({ message: 'No Es Posible Activar Punto Con Votos' });
            }
            let snap = await getCollection(COLLECTIONS.POINTS)
                .where('isActive', '==', true)
                .get();
            if (snap.docs.length) {
                return res.status(400).send({ message: 'Hay Otro Punto Activo. Desactívelo Para Continuar.' });
            }
            let objToUpdate = {};
            objToUpdate.isActive = req.body.isActive;
            let updatedPoint = await getDocById(COLLECTIONS.POINTS, pointId).update({ isActive: req.body.isActive });
            if (!updatedPoint) {
                return res.status(500).send({ message: 'Error Actualizando Estado' });
            }
        }
        let point = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, pointId);
        if (!point) {
            return res.status(500).send({ message: 'Error Obteniendo Punto' });
        }
        return res.status(200).send({ message: 'Estado Actualizado Correctamente', point });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

// --------------------------------------- USER FUNCTIONS ---------------------------------------

const getActivePointById = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ messag: 'El Usuario Autenticado No Existe' });
        }
        if (userReq.role != USER_ROLES.DEPUTY || userReq.role == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId = req.params.id;
        
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        if (!assembly.isActive) {
            return res.status(404).send({ message: 'Asamblea Deshabilitada' });
        }
        let pointId = req.params.pId;
        let point = await getParsedElementFromDBById(COLLECTIONS.POINTS, pointId);
        if (!point) {
            return res.status(404).send({ message: 'Punto De Asamblea No Encontrado' });
        }
        if (!point.isActive) {
            return res.status(404).send({ message: 'Punto De Asamblea Deshabilitado' });
        }
        return res.status(200).send({ message: 'Punto De Asamblea Obtenido Exitosamente', point });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const listPointsByActiveAssemblyById = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(400).send({ messag: 'El Usuario Autenticado No Existe' });
        }
        if (userReq.role != USER_ROLES.DEPUTY || userReq.role == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId = req.params.id;
        let assembly = await getParsedElementFromDBById(COLLECTIONS.ASSEMBLIES, assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        if (!assembly.isActive) {
            return res.status(404).send({ message: 'Asamblea Deshabilitada' });
        }

        let pointsSnap;

        // filtrar las actividades activas de la agenda
        if (req.query.hasOwnProperty('active')) {
            pointsSnap =  await getCollection(COLLECTIONS.POINTS)
                .where('assemblyId', '==', assemblyId)
                .where('isActive', '==', true).get()
        } else {
            pointsSnap =  await getCollection(COLLECTIONS.POINTS)
                .where('assemblyId', '==', assemblyId).get()
        }

        let points = parseQuerySnapshot(pointsSnap);
        if (!points) {
            return res.status(404).send({ message: 'Puntos De Asamblea No Encontrados' });
        }

        if (req.query?.active === 'true' && points.length !== 0) {
            // status del voto del usuario
            points[0]['statusVote'] = false;
            let userVote = await getCollection(COLLECTIONS.VOTES)
                .where('assemblyPtId', '==', points[0].assemblyId)
                .where('pointId', '==', points[0].id)
                .where('userId', '==', req.user.sub).get();
            if (userVote.size) {
                points[0]['statusVote'] = true;
            }
        }
        return res.status(200).send({ message: 'Punto De Asamblea Obtenido Exitosamente', points });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

/**
 * Validate if are missing params
 * @param {any} params user params
 * @returns {boolean} Return true if are missing params and false if all params exists
 */
const areMissingParams = params =>
    !params.name ||
    !params.description;

/**
 * Validate if role input has permissions on Points
 * @param {string} role Role to validate if have permissions
 * @returns {boolean} Return true if role has permissions and false if hasn't it
 */
const validateRoles = role =>
    USER_ROLES.SYSTEMS === role ||
    USER_ROLES.ADMIN === role ||
    USER_ROLES.SUPER_ADMIN === role;

module.exports = {
    createPoint,
    updatePoint,
    deletePoint,
    getPointById,
    listPointsByAssemblyId,
    getActivePointById,
    listPointsByActiveAssemblyById,
    updatePointStatus,
}
