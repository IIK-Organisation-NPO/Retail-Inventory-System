const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');
const validateMovement = require('../middleware/validateMovement');

// storeId comes in the body (POST) or the query (GET); requireActiveStore
// reads it from either place.
router.post(
  '/movement',
  verifyToken,
  authorizeRole('OWNER'),
  requireActiveStore,
  validateMovement,
  inventoryController.recordMovement
);

router.get(
  '/history',
  verifyToken,
  authorizeRole('OWNER'),
  requireActiveStore,
  inventoryController.getMovementHistory
);

module.exports = router;