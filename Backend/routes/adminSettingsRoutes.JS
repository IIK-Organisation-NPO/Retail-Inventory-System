// Backend/routes/adminSettingsRoutes.js
// In server.js add:
//   const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
//   app.use('/api/admin', adminSettingsRoutes);
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  getNotificationPreferences,
  saveNotificationPreferences,
} = require('../controllers/adminSettingsController');

router.get('/settings/notifications', verifyToken, authorizeRole('ADMIN'), getNotificationPreferences);
router.put('/settings/notifications', verifyToken, authorizeRole('ADMIN'), saveNotificationPreferences);

module.exports = router;