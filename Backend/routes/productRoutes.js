const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// ==========================================
// STATIC ROUTES
// These MUST be placed above /:productId so Express 
// doesn't mistake "categories" or "units" for a product ID.
// ==========================================
router.get('/categories', verifyToken, productController.getCategories);
router.get('/units', verifyToken, productController.getUnits);


// ==========================================
// PRODUCT ROUTES
// ==========================================
router.get('/', verifyToken, productController.getProducts);
router.post('/', verifyToken, productController.addProduct);
router.put('/:productId', verifyToken, productController.updateProduct);

module.exports = router;