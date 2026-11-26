const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Every route below is admin-only.
router.use(verifyToken, authorizeRole('ADMIN'));

// GET /api/admin/reports?type=Platform
router.get('/', adminReportController.getReport);

module.exports = router;