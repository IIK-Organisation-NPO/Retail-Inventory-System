const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// ==========================================
// STAFF ROUTES (For the logged-in staff member)
// MUST be placed above /:staffId so Express doesn't 
// mistake "profile" for a staff ID.
// ==========================================
router.get('/profile', verifyToken, authorizeRole('STAFF'), staffController.getMyProfile);
router.put('/profile', verifyToken, authorizeRole('STAFF'), staffController.updateMyProfile);

// ==========================================
// OWNER ROUTES (For managing staff)
// ==========================================
router.get('/', verifyToken, authorizeRole('OWNER'), staffController.getStaff);
router.post('/', verifyToken, authorizeRole('OWNER'), staffController.addStaff);

// Edit staff details (Name, Role, new code, etc.)
router.put('/:staffId', verifyToken, authorizeRole('OWNER'), staffController.updateStaff); 

// Toggle active/disabled status
router.put('/:staffId/status', verifyToken, authorizeRole('OWNER'), staffController.toggleStaffStatus);

module.exports = router;