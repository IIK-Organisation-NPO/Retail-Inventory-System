const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Admin Route
router.get('/admin/dashboard', verifyToken, authorizeRole('ADMIN'), dashboardController.getAdminDashboard);

// Owner Route
router.get('/owner/dashboard', verifyToken, authorizeRole('OWNER'), dashboardController.getOwnerDashboard);

// Supplier Route
router.get('/supplier/dashboard', verifyToken, authorizeRole('SUPPLIER'), dashboardController.getSupplierDashboard);

module.exports = router;