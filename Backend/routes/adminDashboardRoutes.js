const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { getAdminDashboard } = require('../controllers/adminDashboardController');

router.get('/', verifyToken, authorizeRole('ADMIN'), getAdminDashboard);

module.exports = router;