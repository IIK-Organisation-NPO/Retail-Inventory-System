const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// All these routes require an OWNER to be logged in


module.exports = router;