const express = require('express');
const viewsController = require('../modules/public/views/views.controller');

const router = express.Router();

/* view endpoints */
router.get('/calls', viewsController.getCallsView);

module.exports = router;
