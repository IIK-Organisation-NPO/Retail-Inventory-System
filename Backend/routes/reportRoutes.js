const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// --- IMPORT MIDDLEWARE ---
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const checkStoreOwnership = require('../middleware/checkStoreOwnership'); 

// ==========================================
// REPORT ROUTES
// ==========================================

// 1. Get Sales Report (ALLOW STAFF, OWNER, ADMIN)
router.get(
    '/sales', 
    verifyToken, 
    authorizeRole('STAFF', 'OWNER', 'ADMIN'), 
    checkStoreOwnership, 
    reportController.getSalesReport
);

// 2. Get Inventory Report (ALLOW STAFF, OWNER, ADMIN)
router.get(
    '/inventory', 
    verifyToken, 
    authorizeRole('STAFF', 'OWNER', 'ADMIN'), 
    checkStoreOwnership, 
    reportController.getInventoryReport
);

module.exports = router;