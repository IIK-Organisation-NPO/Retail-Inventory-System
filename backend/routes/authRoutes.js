const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, sendOTP, verifyOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// OTP Routes (NEW)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected Test Routes (For Testing RBAC)
router.get('/admin-owner-route', protect, authorize('Admin', 'Owner'), (req, res) => {
    res.json({ message: `Hello ${req.user.role}, you have access to the Admin/Owner area.` });
});

router.get('/staff-route', protect, authorize('Staff'), (req, res) => {
    res.json({ message: `Hello ${req.user.role}, you have access to the Staff area.` });
});

module.exports = router;