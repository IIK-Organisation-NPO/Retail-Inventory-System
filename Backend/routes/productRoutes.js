const express = require('express');
const router = express.Router();
const storeProductController = require('../controllers/storeProductController');

// --- IMPORT MIDDLEWARE ---
// Using the exact names and files from your original working snippet
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const checkStoreOwnership = require('../middleware/checkStoreOwnership'); 

// ==========================================
// FIXED PATHS FIRST (Avoid conflicts with /:productId)
// ==========================================

router.get('/categories', verifyToken, authorizeRole('OWNER'), storeProductController.getCategories);
router.get('/units', verifyToken, authorizeRole('OWNER'), storeProductController.getUnits);

// ==========================================
// PRODUCT ROUTES
// ==========================================

// 1. GET Products (ALLOW STAFF, OWNER, ADMIN)
// We use authorizeRole (singular) here.
router.get(
    '/', 
    verifyToken, 
    authorizeRole('STAFF', 'OWNER', 'ADMIN'), 
    checkStoreOwnership, 
    storeProductController.getProducts
);

// 2. ADD Product (RESTRICTED TO OWNER ONLY)
router.post(
    '/', 
    verifyToken, 
    authorizeRole('OWNER'), 
    storeProductController.addProduct
);

// 3. UPDATE Product (RESTRICTED TO OWNER ONLY)
router.put(
    '/:productId', 
    verifyToken, 
    authorizeRole('OWNER'), 
    storeProductController.updateProduct
);

module.exports = router;