const express = require('express');
const router = express.Router();
const productController = require('../controllers/storeProductController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Owners only for now (staff need the staff-to-store link first)
router.get('/categories', verifyToken, authorizeRole('OWNER'), productController.getCategories);
router.get('/units', verifyToken, authorizeRole('OWNER'), productController.getUnits);

router.get('/', verifyToken, authorizeRole('OWNER'), productController.getProducts);
router.post('/', verifyToken, authorizeRole('OWNER'), productController.addProduct);
router.put('/:productId', verifyToken, authorizeRole('OWNER'), productController.updateProduct);

module.exports = router;