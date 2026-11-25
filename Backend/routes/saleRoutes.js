const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');
const validateSale = require('../middleware/validateSale');

console.log("sale controller exports:", Object.keys(saleController));

// Owners only for now. Staff need the staff-to-store link first.
// Sales can only be recorded or viewed for an Approved store.
router.post('/', verifyToken, authorizeRole('OWNER'), requireActiveStore, validateSale, saleController.recordSale);
router.get('/history', verifyToken, authorizeRole('OWNER'), requireActiveStore, saleController.getSalesHistory);
router.get('/today', verifyToken, authorizeRole('OWNER'), requireActiveStore, saleController.getTodaySales);

module.exports = router;