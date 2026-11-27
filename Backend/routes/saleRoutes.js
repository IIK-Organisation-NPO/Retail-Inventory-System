const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// --- IMPORT MIDDLEWARE ---
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const checkStoreOwnership = require('../middleware/checkStoreOwnership'); // Use this instead of requireActiveStore
const validateSale = require('../middleware/validateSale');

// Optional: Log exports to ensure the controller loaded correctly
console.log("sale controller exports:", Object.keys(saleController));

// ==========================================
// SALES ROUTES
// ==========================================

// 1. Record a Sale (ALLOW STAFF, OWNER, ADMIN)
router.post(
    '/', 
    verifyToken, 
    authorizeRole('STAFF', 'OWNER', 'ADMIN'), 
    checkStoreOwnership, 
    validateSale, 
    saleController.recordSale
);

// 2. Get Sales History (ALLOW STAFF, OWNER, ADMIN)
router.get(
    '/history', 
    verifyToken, 
    authorizeRole('STAFF', 'OWNER', 'ADMIN'), 
    checkStoreOwnership, 
    saleController.getSalesHistory
);

// 3. Get Today's Sales (ALLOW STAFF, OWNER, ADMIN)
router.get(
    '/today', 
    verifyToken, 
    authorizeRole('STAFF', 'OWNER', 'ADMIN'), 
    checkStoreOwnership, 
    saleController.getTodaySales
);

module.exports = router;