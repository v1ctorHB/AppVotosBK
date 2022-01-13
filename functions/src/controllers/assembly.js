'use strict';
const Assembly                      = require('../models/assembly');
const userController                = require('../controllers/user');
const { updateRecursiveCanVote }    = require('../controllers/attendance');
const { COLLECTIONS }               = require('../enums/db-collections.enums');
const { USER_ROLES, USER_STATUS }   = require('../enums/user.enums'); 
const {
    getCollection, getDocById, getParsedElementFromDBById
}                                   = require('../services/base-firestore');

const createAssembly = async (req, res) => {
    try {
        let userReq = await userController.getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let params = req.body;
        let assembly = Assembly;

        if (areMissingParams(params)) {
            return res.status(403).send({ message: 'Faltan Campos Principales' });
        }
        assembly.name       = params.name;
        assembly.date       = params.date;
        assembly.time       = params.time;
        assembly.isActive   = false;
        assembly.status     = '';

        let savedAssembly = await getAssembliesCollection().add(assembly);
        if (!savedAssembly) {
            return res.status(500).send({ message: 'Error Al Guardar Asamblea' });
        }
        let gotAssembly = await getParsedAssemblyById(savedAssembly.id);
        return res.status(200).send({ message: 'Asamblea Agregada Exitosamente', assembly: gotAssembly });
    }
    catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updateAssembly = async (req, res) =>{
    try {
        let userReq = await userController.getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        } 
        let assemblyId  = req.params.id;
        let params      = req.body;
        let objUpdate   = {};

        let assembly2Up = getAssemblyDocById(assemblyId);
        if(!assembly2Up.id) {
            return res.status(404).send({message: 'No Se Encontró La Asamblea'});
        } 
        if (params.name != null) objUpdate.name = params.name;
        if (params.date != null) objUpdate.date = params.date;
        if (params.time != null) objUpdate.time = params.time;
        if (params.status != null) objUpdate.status = params.status

        let updatedAssembly = await getAssemblyDocById(assemblyId).update(objUpdate);
        if(!updatedAssembly){
            return res.status(500).send({ message: 'Error Al Actualizar Asamblea' });
        }
        let assembly = await getParsedAssemblyById(assemblyId);
        return res.status(200).send({ message: 'Asamblea Actualizada Exitosamente', assembly });
    }catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
} 

const deleteAssembly = async (req, res) =>{
    try {
        let userReq = await userController.getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId = req.params.id;
        let assembly = await getParsedAssemblyById(assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        if (assembly.isActive) {
            return res.status(403).send({ message: 'La Asamblea Está Activa. Desactívela Para Continuar.' });
        }
        await deleteAssemblyPoints(assemblyId);
        await getAssemblyDocById(assemblyId).delete();
        return res.status(200).send({ message: 'Asamblea Eliminada Exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const getAssemblyById = async (req, res) => {
    try {
        let userReq = await userController.getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId = req.params.id;
        let assembly = await getParsedAssemblyById(assemblyId);
        if (!assembly) {
            return res.status(404).send({ message: 'Asamblea No Encontrada' });
        }
        assembly.isActive = undefined;
        return res.status(200).send({ message: 'Asamblea Obtenida Exitosamente', assembly });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const listAssemblies = async (req, res) => {
    try {
        let userReq = await userController.getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblies = await getAllParsedAssemblies();
        return res.status(200).send({ message: 'Asambleas Obtenidas Exitosamente', assemblies });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updateAssemblyStatus = async (req, res) => {
    try {
        let userReq = await userController.getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblyId      = req.params.id;
        let params          = req.body;
        let assembly2Update = await getParsedAssemblyById(assemblyId);
        if (!assembly2Update) {
            return res.status(404).send({ message: 'No Se Encontró El Asamblea A Actualizar' });
        }
        if (params.isActive) {
            let activatedAssemblies =
                await getAssembliesCollection()
                    .where('isActive', '==', true)
                    .get();
            if (activatedAssemblies.docs.length) {
                return res.status(403).send({ message: 'Hay Una Asamblea Activa. Desactívela Para Continuar.' });
            }
        } else if (!params.isActive) {
            let activatedPoints = await getCollection(COLLECTIONS.POINTS).where('isActive', '==', true).get();
            if (activatedPoints.docs.length) {
                return res.status(403).send({ message: 'Hay Puntos Activos. Desactívelos Para Continuar.' });
            }
            let attendance = await getCollection(COLLECTIONS.ATTENDANCE).where('assemblyId', '==', assemblyId).get();
            if (attendance.docs.length) {
                let attendanceForum = parseSnapshot(attendance)[0].forum;
                await updateRecursiveCanVote(attendanceForum, false);
            }
        }
        let objUpdate = {};
        objUpdate.isActive = params.isActive;
        if (params.status) {
            objUpdate.status = params.status;
        }
        let updatedAssambleis = await getAssemblyDocById(assemblyId).update(objUpdate);
        if (!updatedAssambleis) {
            return res.status(500).send({ message: 'Error Al Actualizar Asamblea' });
        }
        let assembly = await getParsedAssemblyById(assemblyId);
        return res.status(200).send({ message: 'Asamblea Actualizada Exitosamente', assembly });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const getActiveAssembly = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(404).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let assemblies = await getCollection(COLLECTIONS.ASSEMBLIES).where('isActive', '==', true).get();
        if (!assemblies.docs.length) {
            return res.status(404).send({ message: 'No Se Encontró Alguna Asamblea Activa' });
        }
        let assembly = parseSnapshot(assemblies)[0];
        let attendances = await getCollection(COLLECTIONS.ATTENDANCE).where('assemblyId', '==', assembly.id).get();
        let attendance = parseSnapshot(attendances)[0];
        return res.status(200).send({ message: 'Asamblea Activa Obtenida Exitosamente', assembly, attendance });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

/**
 * Delete assembly Points with it id
 * @param {string} assemblyId Id of assembly
 * @returns {Promise<void>} Promise to be either resolved
 */
const deleteAssemblyPoints = async (assemblyId) => {
    let points = await getCollection(COLLECTIONS.POINTS).where('assemblyId', '==', assemblyId).get();
    await deleteAssemblyPointsRecursively(points.docs.map((val) => val.id));
}

/**
 * Delete points recursively
 * @param {string[]} pointsIds Id of points to be deleted
 * @param {number} index position into array
 * @returns {Promise<void>} Promise to be either resolved
 */
const deleteAssemblyPointsRecursively = async (pointsIds, index) => {
    if (pointsIds[index]) {
        await getDocById(COLLECTIONS.POINTS, pointsIds[index]).delete();
        await deleteAssemblyPointsRecursively(pointsIds, index + 1);
    }
}

/**
 * Get Assembly parsed by id as Assembly Model
 * @param {string} assemblyId Id of Assembly that will be returned
 * @returns Assembly parsed
 */
const getParsedAssemblyById = async assemblyId => {
    let assembly = await getAssemblyDocById(assemblyId).get();
    return { id: assembly.id, ...assembly.data(), };
};

/**
 * Get assemblies pared as Assembly model Array
 * @returns {Promise<any[]>} Promise to be either resolve with the parsed assemblies
 */
const getAllParsedAssemblies = async () => {
    let assemblies = await getAssembliesCollection().get();
    return parseSnapshot(assemblies);
};

/**
 * Parse snapshot as Model
 * @param {FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>} snapshot Firebase Snapshot that will be parsed
 * @returns Parsed assemblies
 */
const parseSnapshot = (snapshot) => {
    return snapshot.docs.map((element) => {
        return { id: element.id, ...element.data() };
    });
}

/**
 * Get Assembly Document from Firebase
 * @param {string} assemblyId Assembly id of Assembly doc that will be returned
 * @returns {FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>} Document obtained from Firebase
 */
const getAssemblyDocById = assemblyId => getAssembliesCollection().doc(assemblyId);

/**
 * Ger Assemblies Collection from Firebase
 * @returns {FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>} Assembly Collection
 */
const getAssembliesCollection = () => getCollection(COLLECTIONS.ASSEMBLIES);

/**
 * 
 * @param {string} role Role to validate if have Permissions
 * @returns {boolean} Return true if role has permissions and false if hasn´t it
 */ 
const validateRoles = role =>
    role === USER_ROLES.SYSTEMS || 
    role === USER_ROLES.SUPER_ADMIN;

/**
 * Validate if are missing params
 * @param {any} params assembly params
 * @returns {boolean} Return true if are missing params and false if all params exists
 */
 const areMissingParams = params => 
    !params.name; 

module.exports = {
    getParsedAssemblyById,
    createAssembly,
    updateAssembly,
    updateAssemblyStatus,
    deleteAssembly,
    getAssemblyById,
    listAssemblies,
    getActiveAssembly,
}
