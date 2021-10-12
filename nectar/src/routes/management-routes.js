const express = require('express');
const mw = require('../shared/middlewares');
const { ROLES } = require('../shared/database/user/user.enums');
const managementUsersController = require('../modules/management/users/users.controller');
const managementEntitiesController = require('../modules/management/entities/entities.controller');
const managementSessionsController = require('../modules/management/sessions/sessions.controller');
const managementEntityConfigController = require('../modules/management/entity-configs/entity-configs.controller');


const router = express.Router();

/* API ENDPOINTS */

/* ----------- MANAGEMENT ----------- */
/* ENTITIES */
router.get('/entities', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementEntitiesController.getEntities);
router.post('/entities', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementEntitiesController.createEntity);
router.patch('/entities', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementEntitiesController.updateEntity);

/* ENTITY CONFIGS */
router.get('/entity-configs/:entityId', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementEntityConfigController.getEntityConfigs);
router.patch('/entity-configs/:entityId', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementEntityConfigController.updateEntityConfig);

/* USERS */
router.get('/users', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementUsersController.getUsers);

/* SESSIONS */
router.get('/sessions/:entityId', mw.validateToken, mw.validateRole([ROLES.SUPER]), managementSessionsController.getSessions);

module.exports = router;
