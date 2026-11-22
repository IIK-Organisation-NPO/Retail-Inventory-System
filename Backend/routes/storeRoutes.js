const express = require('express');
const storeRegistrationController = require('../controllers/storeRegistrationController');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const validateAddStaff = require('../middleware/validateAddStaff');

// Only a logged-in OWNER can create or view their stores
router.post('/', verifyToken, authorizeRole('OWNER'), storeController.createStore);
router.get('/my-stores', verifyToken, authorizeRole('OWNER'), storeController.getMyStores);
router.post('/lookup', verifyToken, authorizeRole('OWNER'), storeRegistrationController.lookupCompanyByRegNumber);
router.get('/:storeId', verifyToken, authorizeRole('OWNER'), storeController.getStoreById);
router.put('/:storeId', verifyToken, authorizeRole('OWNER'), storeController.updateStore);

// Add staff to a store (TEMPORARY handler until the database is ready)
router.post(
  '/:storeId/staff',
  verifyToken,
  authorizeRole('OWNER'),
  validateAddStaff,
  (req, res) => {
    res.status(201).json({
      message: 'Staff data is valid',
      staff: { ...req.body, status: 'Active' },
    });
  }
);

module.exports = router;