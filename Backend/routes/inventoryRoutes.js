const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.post('/movement', verifyToken, inventoryController.recordMovement);
router.get('/history', verifyToken, inventoryController.getMovementHistory);

module.exports = router;