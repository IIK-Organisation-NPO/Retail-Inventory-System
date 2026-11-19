const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Only Owners can manage staff
router.get('/', verifyToken, authorizeRole('OWNER'), staffController.getStaff);
router.post('/', verifyToken, authorizeRole('OWNER'), staffController.addStaff);
router.put('/:staffId/status', verifyToken, authorizeRole('OWNER'), staffController.toggleStaffStatus);

module.exports = router;