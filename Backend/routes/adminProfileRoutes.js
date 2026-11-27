// Backend/routes/adminProfileRoutes.js
// In server.js add:
//   const adminProfileRoutes = require('./routes/adminProfileRoutes');
//   app.use('/api/admin', adminProfileRoutes);
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require('../controllers/adminProfileController');

router.get('/profile', verifyToken, authorizeRole('ADMIN'), getAdminProfile);
router.put('/profile', verifyToken, authorizeRole('ADMIN'), updateAdminProfile);
router.put('/change-password', verifyToken, authorizeRole('ADMIN'), changeAdminPassword);

module.exports = router;