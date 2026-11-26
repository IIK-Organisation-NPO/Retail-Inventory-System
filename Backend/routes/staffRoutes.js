const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');


router.get('/profile', verifyToken, authorizeRole('STAFF'), staffController.getMyProfile);
router.put('/profile', verifyToken, authorizeRole('STAFF'), staffController.updateMyProfile);
router.get('/', verifyToken, authorizeRole('OWNER'), staffController.getStaff);
router.post('/', verifyToken, authorizeRole('OWNER'), staffController.addStaff);

// Edit staff details (Name, Role, new code, etc.)
router.put('/:staffId', verifyToken, authorizeRole('OWNER'), staffController.updateStaff); 

// Toggle active/disabled status
router.put('/:staffId/status', verifyToken, authorizeRole('OWNER'), staffController.toggleStaffStatus);

module.exports = router;