const express = require('express');
const authController = require('../modules/auth/auth.controller');

const router = express.Router();

/* API ENDPOINTS */

/* AUTH */
router.get('/auth/login/:token', authController.checkValidLogin);
router.post('/auth/login', authController.login);
router.post('/auth/signup', authController.signup);

module.exports = router;
