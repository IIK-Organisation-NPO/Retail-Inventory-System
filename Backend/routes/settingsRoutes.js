const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRole('OWNER'), settingsController.getSettings);
router.put('/', verifyToken, authorizeRole('OWNER'), settingsController.saveSettings);

module.exports = router;