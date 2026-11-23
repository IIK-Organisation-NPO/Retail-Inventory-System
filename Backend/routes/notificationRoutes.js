const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware'); 

// Note: We removed authorizeRole('OWNER') here because BOTH 
// Store Owners and Staff need to access their notifications.

// Get all notifications (Owner sees their own, Staff sees store-wide)
router.get('/', verifyToken, notificationController.getNotifications);

// Mark ALL notifications as read
router.put('/mark-read', verifyToken, notificationController.markAllAsRead);

// Mark a SINGLE notification as read
router.put('/:notificationId/read', verifyToken, notificationController.markAsRead);

module.exports = router;