const express = require('express');
const storeRegistrationController = require('../controllers/storeRegistrationController');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const requireActiveStore = require('../middleware/requireActiveStore');
const validateAddStaff = require('../middleware/validateAddStaff');

// Only a logged-in OWNER can create or view their stores.
// The routes below are NOT behind requireActiveStore on purpose: the store
// switcher must list every store (including Pending, Rejected and Suspended
// ones) and a rejected store must stay editable so the owner can send it again.
router.post('/', verifyToken, authorizeRole('OWNER'), storeController.createStore);
router.get('/my-stores', verifyToken, authorizeRole('OWNER'), storeController.getMyStores);
router.post('/lookup', verifyToken, authorizeRole('OWNER'), storeRegistrationController.lookupCompanyByRegNumber);
router.get('/:storeId', verifyToken, authorizeRole('OWNER'), storeController.getStoreById);
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