const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Every route below is admin-only.
router.use(verifyToken, authorizeRole('ADMIN'));

// List every user (admins, owners, staff, suppliers)
router.get('/', adminUserController.listUsers);

// Enable or disable one user, e.g. PUT /api/admin/users/owner-4/status
router.put('/:userId/status', adminUserController.updateUserStatus);

module.exports = router;