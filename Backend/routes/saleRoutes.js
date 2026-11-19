const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, saleController.recordSale);
router.get('/today', verifyToken, saleController.getTodaySales);

module.exports = router;