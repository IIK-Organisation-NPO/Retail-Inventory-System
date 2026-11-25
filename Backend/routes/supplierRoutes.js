const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { validateChangePassword } = require('../validators/supplierValidator');

router.use(verifyToken, authorizeRole('SUPPLIER'));

router.get('/dashboard', supplierController.getDashboard);
router.get('/profile', supplierController.getProfile);
router.put('/profile', supplierController.updateProfile);
router.post('/resend-email-otp', supplierController.resendEmailOTP);

// Step 4B — Supplier password change.
router.put(
  '/change-password',
  (req, res, next) => {
    const { errors, cleaned } = validateChangePassword(req.body || {});
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }
    req.body = cleaned;
    next();
  },
  supplierController.changePassword
);

// Step 4C — Company profile persistence (categories / delivery areas / depots)
router.get('/company-profile', supplierController.getCompanyProfile);
router.put('/company-profile', supplierController.updateCompanyProfile);

module.exports = router;