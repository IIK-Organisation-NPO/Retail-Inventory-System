const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');


router.get('/profile', verifyToken, authorizeRole('STAFF'), staffController.getMyProfile);
router.put('/profile', verifyToken, authorizeRole('STAFF'), staffController.updateMyProfile);

// Staff list (?storeId=) and add staff (storeId in the body) only work for an Approved store.
router.get('/', verifyToken, authorizeRole('OWNER'), requireActiveStore, staffController.getStaff);
router.post('/', verifyToken, authorizeRole('OWNER'), requireActiveStore, staffController.addStaff);

// Edit staff details (Name, Role, new code, etc.)
router.put('/:staffId', verifyToken, authorizeRole('OWNER'), staffController.updateStaff);

// Toggle active/disabled status
router.put('/:staffId/status', verifyToken, authorizeRole('OWNER'), staffController.toggleStaffStatus);

module.exports = router;