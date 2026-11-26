const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Every product route works on a store owned by the signed-in OWNER or STAFF.
// The controller checks stores.OwnerID against req.user.id, so only owner
// tokens may reach it (a staff id could otherwise match another owner's id).

// Fixed paths first, so they are never read as a :productId
router.get('/categories', verifyToken, authorizeRole('OWNER', 'STAFF'), productController.getCategories);
router.get('/units', verifyToken, authorizeRole('OWNER', 'STAFF'), productController.getUnits);

// Main products route (Only defined ONCE now)
router.get('/', verifyToken, authorizeRole('OWNER', 'STAFF'), productController.getProducts);

// Keep POST and PUT as OWNER only
router.post('/', verifyToken, authorizeRole('OWNER'), productController.addProduct);
router.put('/:productId', verifyToken, authorizeRole('OWNER'), productController.updateProduct);

module.exports = router;