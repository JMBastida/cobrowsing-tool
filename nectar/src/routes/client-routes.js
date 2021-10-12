const express = require('express');
const mw = require('../shared/middlewares');
const { ROLES } = require('../shared/database/user/user.enums');
const clientsFontsController = require('../modules/clients/fonts/fonts.controller');
const clientsUsersController = require('../modules/clients/users/users.controller');
const clientsFilesController = require('../modules/clients/files/files.controller');
const clientsSupportController = require('../modules/clients/support/support.controller');
const clientsSessionsController = require('../modules/clients/sessions/sessions.controller');
const clientsEntityConfigsController = require('../modules/clients/entity-configs/entity-configs.controller');


const router = express.Router();

/* API ENDPOINTS */

/* ----------- CLIENTS ----------- */
/* ENTITIES */
router.get('/config', mw.validateToken, clientsEntityConfigsController.getEntityConfig);
router.patch('/config/widget', mw.validateToken, mw.validateRole([ROLES.ADMIN]), clientsEntityConfigsController.changeWidgetAvailability);
router.patch('/config', mw.validateToken, mw.validateRole([ROLES.ADMIN]), clientsEntityConfigsController.updateEntityConfig);

/* USERS */
router.get('/users/self', mw.validateToken, clientsUsersController.getSelfUser);
router.get('/users', mw.validateToken, clientsUsersController.getUsers);
router.post('/users', mw.validateToken, mw.validateRole([ROLES.ADMIN]), clientsUsersController.createUser);
router.patch('/users/self', mw.validateToken, clientsUsersController.updateSelfUser);
router.patch('/users', mw.validateToken, mw.validateRole([ROLES.ADMIN]), clientsUsersController.updateUser);

/* SESSIONS */
router.get('/sessions', mw.validateToken, clientsSessionsController.getSessions);
router.patch('/sessions', mw.validateToken, clientsSessionsController.updateSession);

/* FILES */
router.post('/files/upload/:code', mw.validateToken, mw.upload, clientsFilesController.uploadFile);

/* SUPPORT */
router.post('/support', mw.validateToken, clientsSupportController.supportRequest);

/* FONTS */
router.post('/fonts', mw.validateToken, clientsFontsController.handleFonts);

module.exports = router;
