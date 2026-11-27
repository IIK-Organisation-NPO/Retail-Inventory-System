const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');

// requireActiveStore only blocks the owner (or staff) of a store that is not
// Approved; it reads ?storeId= from the query. Access rules are unchanged.
router.get('/sales', verifyToken, requireActiveStore, reportController.getSalesReport);
router.get('/inventory', verifyToken, requireActiveStore, reportController.getInventoryReport);

module.exports = router;