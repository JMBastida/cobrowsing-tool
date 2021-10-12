const express = require('express');
const libController = require('../modules/public/lib/lib.controller');

const router = express.Router();

/* lib endpoints */
router.get('/iframe', libController.getIframeLib);
router.get('/:code', libController.getCoBrowsingLib);

module.exports = router;
