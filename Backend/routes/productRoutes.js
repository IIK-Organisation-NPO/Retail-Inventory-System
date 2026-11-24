const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Only logged-in owners/staff can access these routes
router.get('/', verifyToken, productController.getProducts);
router.post('/', verifyToken, productController.addProduct);
router.put('/:productId', verifyToken, productController.updateProduct);

module.exports = router;