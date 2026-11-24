const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const validateSale = require('../middleware/validateSale');

console.log("sale controller exports:", Object.keys(saleController));

// Owners only for now. Staff need the staff-to-store link first.
router.post('/', verifyToken, authorizeRole('OWNER'), validateSale, saleController.recordSale);
router.get('/history', verifyToken, authorizeRole('OWNER'), saleController.getSalesHistory);
router.get('/today', verifyToken, authorizeRole('OWNER'), saleController.getTodaySales);

module.exports = router;