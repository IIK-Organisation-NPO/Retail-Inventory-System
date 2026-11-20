const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register/owner', authController.registerOwner);
router.post('/register/supplier', authController.registerSupplier);
router.post('/login', authController.login);
router.post('/forgot-password/request-otp', authController.requestOTP);
router.post('/forgot-password/reset', authController.resetPassword);

// NEW ROUTE:
router.post('/verify-email', authController.verifyEmail); 

module.exports = router;