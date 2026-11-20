const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// All these routes require an OWNER to be logged in
router.get('/profile', verifyToken, authorizeRole('OWNER'), ownerController.getProfile);
router.put('/profile', verifyToken, authorizeRole('OWNER'), ownerController.updateProfile);
router.put('/change-password', verifyToken, authorizeRole('OWNER'), ownerController.changePassword);

module.exports = router;