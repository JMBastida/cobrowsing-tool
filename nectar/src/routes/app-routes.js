const express = require('express');
const clientRoutes = require('./client-routes');
const publicRoutes = require('./public-routes');
const backdoorRoutes = require('./backdoor-routes');
const managementRoutes = require('./management-routes');

const router = express.Router();

router.use(publicRoutes);
router.use(clientRoutes);
router.use('/bd', backdoorRoutes);
router.use('/management', managementRoutes);

module.exports = router;
