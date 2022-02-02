'use strict';

const userDB            = 'USERS';
const User              = require('../models/user');
const { db, configDb }  = require('../services/google');
const authFirebase = require('firebase/auth');
const jwt               = require('../services/jwt');
const { validate }      = require('email-validator');
const { COUNTRIES }     = require('../enums/country.enums');
const {
    USER_ROLES,
    USER_STATUS,
}                       = require('../enums/user.enums');
const {
    hashField,
    compareWithHashed,
}                       = require('../services/bcrypt');
const { 
    getParsedElementFromDBById, getDocById
}                       = require('../services/base-firestore');
const { COLLECTIONS }   = require('../enums/db-collections.enums');
const KEY_TO_ACCESS     = '+WAHB-%10%-$ADMIN$+'

/**
 * Promise that create default App admins
 */
const createDefaultadmin = async () => {
    try {
        let users = await getAllParsedUsers();
        let admins = users.filter(superadmins => superadmins.role === USER_ROLES.SUPER_ADMIN);
        if (admins.length > 0) {
            return;
        }
        let user = User;
        user.name       = 'admin';
        user.lastname   = 'development';
        user.email      = 'denod48590@kruay.com';
        user.password   = await hashField('admin_wahb_dev');
        user.country    = COUNTRIES.GUATEMALA;
        user.role       = USER_ROLES.SUPER_ADMIN;
        user.status     = USER_STATUS.INACTIVE;
        user.canVote    = false;
        user.isPresent  = false;
        user.image      = '';
        user.phoneNum   = '11111111';
        // create email and password in authentication
        const propertiesDataUser = {
            'password': await hashField('admin_wahb_dev'),
            'email': 'denod48590@kruay.com'
        }
        // create user with email and password in Firebase Auth
        const { uid } = await configDb.auth().createUser(propertiesDataUser);
        // create custom token with id user
        const token = await  configDb.auth().createCustomToken(uid);
        // get auth and app initialize in file -> google config
        const auth = authFirebase.getAuth();
        // authenticate user, param token and auth app
        const result = await authFirebase.signInWithCustomToken(auth, token);
        // send email verification
        await authFirebase.sendEmailVerification(result.user);
        // logout app user
        await authFirebase.signOut(auth);
        // save data user in firestore
        await getUsersCollection().add(user);
    } catch (error) {
        console.error(error);
    }
};

const createUserFromWeb = async (req, res) => {
    try {
        let params = req.body;
        if (areMissingParams(params)) {
            return res.status(400).send({ message: 'Faltan Campos Principales' });
        }
        if (!validate(params.email)) {
            return res.status(400).send({ message: 'Email No Válido' });
        }

        let validateEmail = await getUsersCollection().where('email', '==', params.email).get();
        if (validateEmail.size) {
            return res.status(400).send({ message: 'Ya Existe Un Usuario Con Ese Correo' });
        }
        if (!validateRoles(params.role)) {
            return res.status(403).send({ message: 'Rol Inexistente' });
        }
        if (params.role === USER_ROLES.SUPER_ADMIN && params.password === '') {
            return res.status(400).send({ message: 'Faltan Campos Principales' });
        }

        let user        = User;
        user.name       = params.name;
        user.lastname   = params.lastname || '';
        user.email      = params.email;
        if (params.role === USER_ROLES.SUPER_ADMIN) {
            user.password = await hashField(params.password);
        } else {
            user.password = '';
        }
        user.phoneNum   = params.phoneNum || '';
        user.image      = params.image || '';
        user.country    = params.country || COUNTRIES.GUATEMALA;
        user.role       = params.role;
        user.status     = USER_STATUS.INACTIVE;
        user.canVote    = false;
        let savedUser   = await getUsersCollection().add(user);
        let newUser     = await getParsedUserById(savedUser.id);

        delete newUser.password;
        delete newUser.country;
        return res.status(200).send({ message: 'Usuario Creado Exitosamente', user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const createUser = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let params = req.body;
        if (areMissingParams(params)) {
            return res.status(400).send({ message: 'Faltan Campos Principales' });
        }
        if (!validate(params.email)) {
            return res.status(400).send({ message: 'Email No Válido' });
        }

        let validateEmail = await getUsersCollection().where('email', '==', params.email).get();
        if (validateEmail.size) {
            return res.status(400).send({ message: 'Ya Existe Un Usuario Con Ese Correo' });
        }
        if (!validateRoles(params.role)) {
            return res.status(403).send({ message: 'Rol Inexistente' });
        }
        if (params.role === USER_ROLES.SUPER_ADMIN && params.password === '') {
            return res.status(400).send({ message: 'Faltan Campos Principales' });
        }

        let user        = User;
        user.name       = params.name;
        user.lastname   = params.lastname || '';
        user.email      = params.email;
        if (params.role === USER_ROLES.SUPER_ADMIN) {
            user.password = await hashField(params.password);
        } else {
            user.password = '';
        }
        user.phoneNum   = params.phoneNum || '';
        user.image      = params.image || '';
        user.country    = params.country || COUNTRIES.GUATEMALA;
        user.role       = params.role;
        user.status     = USER_STATUS.INACTIVE;
        user.canVote    = false;
        let savedUser   = await getUsersCollection().add(user);
        let newUser     = await getParsedUserById(savedUser.id);

        delete newUser.password;
        delete newUser.country;
        return res.status(200).send({ message: 'Usuario Creado Exitosamente', user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const login = async (req, res) => {
    try {
        let params      = req.body;
        let userLogin   = await getUsersCollection().where('email', '==', params.email).get();
        let user        = parseSnapshot(userLogin)[0];
        if (!user) {
            return res.status(400).send({ message: 'No Existe Ningún Usuario Con Ese Correo' });
        }
        let userId      = user.id;
        if (user.status === USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        if (user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.SYSTEMS) {
            let passwordMatchs = await compareWithHashed(params.password, user.password);
            if (!passwordMatchs) {
                return res.status(400).send({ message: 'Contraseña Incorrecta' });
            }
        } else if(KEY_TO_ACCESS != params.keyToAccess) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        // const isAdmin = user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.SYSTEMS;
        // const token = isAdmin ? jwt.createToken(userId) : jwt.createUserToken(userId);
        const token = jwt.createToken(userId);
        user.password   = undefined;
        user.phoneNum   = undefined;
        user.status     = undefined;
        return res.status(200).send({
            message: 'Usuario Autenticado Exitosamente', token: token, user: {
                id: userId, ...user,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updateUser = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (userReq.id != req.params.id) {
            if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
                return res.status(403).send({ message: 'Acceso Denegado' });
            }
        }
        let userId      = req.params.id;
        let params      = req.body;
        let objUpdate   = {};

        let user2Update = await getParsedUserById(userId);
        if (!user2Update) {
            return res.status(404).send({ message: 'No Se Encontró El Usuario A Actualizar' });
        }
        if (params.name != null)        objUpdate.name      = params.name;
        if (params.lastname != null)    objUpdate.lastname  = params.lastname;
        if (params.country != null)     objUpdate.country   = params.country;
        if (params.phoneNum != null)    objUpdate.phoneNum  = params.phoneNum;
        if (params.image != null)       objUpdate.image     = params.image;
        if (params.role != null)        objUpdate.role      = params.role;
        if (params.status != null)      objUpdate.status    = params.status;
        if (params.canVote != null)     objUpdate.canVote   = params.canVote;
        let updatedUser = await getUserDocById(userId).update(objUpdate);
        if (!updatedUser) {
            return res.status(500).send({ message: 'Error Al Actualizar Usuario' });
        }
        let user = await getParsedUserById(userId);
        return res.status(200).send({ message: 'Usuario Actualizado Exitosamente', user: user });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const deleteUser = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }

        let userId = req.params.id;
        let user = await getParsedUserById(userId);
        if (!user) {
            return res.status(404).send({ message: 'Usuario No Encontrado' });
        }
        await getUserDocById(userId).delete();
        return res.status(200).send({ message: 'Usuario Eliminado Exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const getUser = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let userId  = req.params.id;
        let user    = await getParsedUserById(userId);
        if (!user) {
            return res.status(404).message({ message: 'No Se Encontró Al Usuario' });
        }
        return res.status(200).send({ message: 'Usuario Obtenido Exitosamente', user: user });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const getLoggedUser = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (userReq.status === USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Usuario Desactivado. Comuníquese Con Su Administrador Para Más Información.' });
        }
        userReq.password = undefined;
        userReq.status = undefined;
        return res.status(200).send({ message: 'Usuario Obtenido Exitosamente', user: userReq });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const listUsers = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let users = await getAllParsedUsers();
        return res.status(200).send({ message: 'Usuarios Obtenidos Exitosamente', users: users });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const listUsersForAttendance = async (req, res) => {
    try {
        let userReq = await getParsedUserById(req.user.sub);
        if (!userReq) {
            return res.status(400).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status == USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let users = await getUsersCollection().where('role', '==', USER_ROLES.DEPUTY).get();
        let parsedUsers = parseSnapshot(users);
        parsedUsers = parsedUsers.filter((user) => user.status === USER_STATUS.ACTIVE);
        parsedUsers = parsedUsers.map((user) => {
            return {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                isPresent: false,
                country: user.country,
            }
        });
        return res.status(200).send({ message: 'Usuarios Obtenidos Exitosamente', users: parsedUsers });
    } catch (e) {
        console.error(error);
        return res.status(400).send(error);
    }
}

const updateUserStatus = async (req, res) => {
    try {
        let userReq = await getParsedElementFromDBById(COLLECTIONS.USERS, req.user.sub);
        if (!userReq) {
            return res.status(404).send({ message: 'El Usuario Autenticado No Existe' });
        }
        if (!validateRoles(userReq.role) || userReq.status === USER_STATUS.INACTIVE) {
            return res.status(403).send({ message: 'Acceso Denegado' });
        }
        let userId  = req.params.id;
        let params  = req.body;
        let obj2Upd = {};
        let userExist = getParsedElementFromDBById(COLLECTIONS.USERS, userId);
        if (!userExist) {
            return res.status(404).send({ message: 'Usuario No Encontrado' });
        }
        if (params.status != USER_STATUS.ACTIVE && params.status != USER_STATUS.INACTIVE) {
            return res.status(401).send({ message: 'Estado Inválido' });
        }
        if (params.status === USER_STATUS.INACTIVE && userExist.canVote) {
            return res.status(403).send({ message: 'Votación Curso. No Se Puede Desactivar Al Usuario.' });
        }
        obj2Upd.status = params.status;
        let updatedUser = await getDocById(COLLECTIONS.USERS, userId).update(obj2Upd);
        if (!updatedUser) {
            return res.status(500).send({ message: 'Error Actualizando Estado' });
        }
        let user = await getParsedElementFromDBById(COLLECTIONS.USERS, userId);
        return res.status(200).send({ message: 'Usuario Actualizado Exitosamente', user });
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
}

/**
 * Get User parsed by id as User Model
 * @param {string} userId Id of User that will be returned
 * @returns User parsed
 */
const getParsedUserById = async userId => {
    let user = await getUserDocById(userId).get();
    return { id: user.id, ...user.data(), };
};

/**
 * Get users pared as User model Array
 * @returns {Promise<any[]>} Promise to be either resolve with the parsed users
 */
const getAllParsedUsers = async () => {
    let users = await getUsersCollection().get();
    return parseSnapshot(users);
};

/**
 * Parse snapshot as Model
 * @param {FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>} snapshot Firebase Snapshot that will be parsed
 * @returns {any[]} Parsed users
 */
const parseSnapshot = snapshot => {
    return snapshot.docs.map((element) => {
        return { id: element.id, ...element.data() };
    });
}

/**
 * Get User Document from Firebase
 * @param {string} userId User id of User doc that will be returned
 * @returns {FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>} Document obtained from Firebase
 */
const getUserDocById = userId => getUsersCollection().doc(userId);

/**
 * Ger Users Collection from Firebase
 * @returns {FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>} User Collection
 */
const getUsersCollection = () => db.collection(userDB);

/**
 * Validate if role input has permissions on Points
 * @param {string} role Role to validate if have permissions
 * @returns {boolean} Return true if role has permissions and false if hasn't it
 */
const validateRoles = role =>
    USER_ROLES.SYSTEMS      === role ||
    USER_ROLES.ADMIN        === role ||
    USER_ROLES.SUPER_ADMIN  === role ||
    USER_ROLES.DEPUTY       === role;

/**
 * Validate if are missing params
 * @param {any} params user params
 * @returns {boolean} Return true if are missing params and false if all params exists
 */
const areMissingParams = params =>
    !params.name ||
    !params.email ||
    !params.country ||
    !params.role;

module.exports = {
    createDefaultadmin,
    createUser,
    createUserFromWeb,
    login,
    updateUser,
    deleteUser,
    getUser,
    getLoggedUser,
    listUsers,
    getParsedUserById,
    updateUserStatus,
    listUsersForAttendance,
}