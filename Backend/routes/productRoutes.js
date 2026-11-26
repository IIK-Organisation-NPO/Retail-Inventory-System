const express = require('express');
const router = express.Router();
const storeProductController = require('../controllers/storeProductController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Every product route works on a store owned by the signed-in OWNER.
// The controller checks stores.OwnerID against req.user.id, so only owner
// tokens may reach it (a staff id could otherwise match another owner's id).
// Cashier access will be added later through the storeusers table.

// Fixed paths first, so they are never read as a :productId
router.get('/categories', verifyToken, authorizeRole('OWNER'), storeProductController.getCategories);
router.get('/units', verifyToken, authorizeRole('OWNER'), storeProductController.getUnits);

router.get('/', verifyToken, authorizeRole('OWNER'), storeProductController.getProducts);
router.post('/', verifyToken, authorizeRole('OWNER'), storeProductController.addProduct);
router.put('/:productId', verifyToken, authorizeRole('OWNER'), storeProductController.updateProduct);

module.exports = router;