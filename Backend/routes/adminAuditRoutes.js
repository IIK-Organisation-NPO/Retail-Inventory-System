const express = require('express');
const router = express.Router();
const adminAuditController = require('../controllers/adminAuditController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Every route below is admin-only.
router.use(verifyToken, authorizeRole('ADMIN'));

// GET /api/admin/audit-log?search=&action=&user=&range=&page=&limit=
router.get('/', adminAuditController.listAuditLog);

module.exports = router;