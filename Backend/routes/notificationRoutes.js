const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRole('OWNER'), notificationController.getNotifications);
router.put('/mark-read', verifyToken, authorizeRole('OWNER'), notificationController.markAllAsRead);

module.exports = router;