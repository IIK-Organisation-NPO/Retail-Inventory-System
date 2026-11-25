const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');

// Admin dashboard
router.get(
  '/admin/dashboard',
  verifyToken,
  authorizeRole('ADMIN'),
  dashboardController.getAdminDashboard
);

// Owner dashboard (requires ?storeId=). Blocked with a clear message when the
// selected store is Pending, Rejected or Suspended.
router.get(
  '/owner/dashboard',
  verifyToken,
  authorizeRole('OWNER'),
  requireActiveStore,
  dashboardController.getOwnerDashboard
);

module.exports = router;