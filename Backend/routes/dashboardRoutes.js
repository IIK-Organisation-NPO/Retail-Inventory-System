const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Admin dashboard
router.get(
  '/admin/dashboard',
  verifyToken,
  authorizeRole('ADMIN'),
  dashboardController.getAdminDashboard
);

// Owner dashboard (requires ?storeId=)
router.get(
  '/owner/dashboard',
  verifyToken,
  authorizeRole('OWNER'),
  dashboardController.getOwnerDashboard
);

module.exports = router;