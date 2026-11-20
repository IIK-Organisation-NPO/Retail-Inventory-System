const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/sales', verifyToken, reportController.getSalesReport);
router.get('/inventory', verifyToken, reportController.getInventoryReport);

module.exports = router;