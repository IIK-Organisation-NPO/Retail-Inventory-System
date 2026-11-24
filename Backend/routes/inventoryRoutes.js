const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const validateMovement = require('../middleware/validateMovement');

router.post(
  '/movement',
  verifyToken,
  authorizeRole('OWNER'),
  validateMovement,
  inventoryController.recordMovement
);

router.get(
  '/history',
  verifyToken,
  authorizeRole('OWNER'),
  inventoryController.getMovementHistory
);

module.exports = router;