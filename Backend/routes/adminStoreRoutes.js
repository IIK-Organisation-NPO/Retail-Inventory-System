const express = require('express');
const router = express.Router();
const adminStoreController = require('../controllers/adminStoreController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Every route below is admin-only.
router.use(verifyToken, authorizeRole('ADMIN'));

// List stores (optional ?status=Pending|Approved|Rejected and ?search=)
router.get('/', adminStoreController.listStores);

// One store: details + functionality summary + last decision
router.get('/:storeId', adminStoreController.getStore);

// Approve or reject a store
router.put('/:storeId/status', adminStoreController.updateStoreStatus);

module.exports = router;