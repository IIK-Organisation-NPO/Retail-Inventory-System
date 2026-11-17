const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public Routes (No token required)
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ==========================================
// PROTECTED TEST ROUTES (For Testing RBAC)
// ==========================================

// Only Admin and Owner can access this
router.get('/admin-owner-route', protect, authorize('Admin', 'Owner'), (req, res) => {
    res.json({ message: `Hello ${req.user.role}, you have access to the Admin/Owner area.` });
});

// Only Staff can access this
router.get('/staff-route', protect, authorize('Staff'), (req, res) => {
    res.json({ message: `Hello ${req.user.role}, you have access to the Staff area.` });
});

module.exports = router;