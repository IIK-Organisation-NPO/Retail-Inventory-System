const express = require('express');
const router = express.Router();

// Controllers
const storeRegistrationController = require('../controllers/storeRegistrationController');
const storeController = require('../controllers/storeController'); // Declared ONCE here

// Middleware
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');
const validateAddStaff = require('../middleware/validateAddStaff');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get Store Logo (Placed BEFORE /:storeId so it isn't read as an ID)
router.get('/:storeId/logo', storeController.getStoreLogo);

// ==========================================
// PROTECTED ROUTES (Require Token)
// ==========================================

// CIPC Lookup
router.post('/lookup', verifyToken, authorizeRole('OWNER'), storeRegistrationController.lookupCompanyByRegNumber);

// Create a new store
router.post('/', verifyToken, authorizeRole('OWNER'), storeController.createStore);

// Get all stores for the logged-in user (Owner or Staff)
router.get('/my-stores', verifyToken, authorizeRole('OWNER', 'STAFF'), storeController.getMyStores);
router.get('/', verifyToken, authorizeRole('OWNER'), storeController.getMyStores); // Kept as a fallback if frontend calls just /api/stores

// Get a specific store by ID (For editing)
router.get('/:storeId', verifyToken, authorizeRole('OWNER'), storeController.getStoreById);

// Update a specific store
router.put('/:storeId', verifyToken, authorizeRole('OWNER'), storeController.updateStore);

// Add staff to a store (TEMPORARY handler until the database is ready).
// Only allowed on an Approved store.
router.post(
  '/:storeId/staff',
  verifyToken,
  authorizeRole('OWNER'),
  requireActiveStore,
  validateAddStaff,
  (req, res) => {
    res.status(201).json({
      message: 'Staff data is valid',
      staff: { ...req.body, status: 'Active' },
    });
  }
);

module.exports = router;