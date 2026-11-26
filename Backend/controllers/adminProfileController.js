// Backend/controllers/adminProfileController.js
const bcrypt = require('bcryptjs'); // change to require('bcrypt') if that is what authController.js uses
const db = require('../config/db');

// Works whether config/db exports a callback pool or a promise pool
const pool = typeof db.promise === 'function' ? db.promise() : db;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^0\d{9}$/; // 10 digits, e.g. 0820000000 (MobileNumber is varchar(12))
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// "082 000 0000" / "+27 82 000 0000" -> "0820000000"
const normaliseMobile = (value) => {
  let m = String(value || '').replace(/[\s\-()]/g, '');
  if (m.startsWith('+27')) m = '0' + m.slice(3);
  return m;
};

const formatProfile = (row) => ({
  name: row.Name,
  surname: row.Surname,
  fullName: `${row.Name} ${row.Surname}`.trim(),
  role: 'Administrator',
  email: row.Email,
  mobile: row.MobileNumber,
  isEmailVerified: !!row.IsEmailVerified,
});

// GET /api/admin/profile
const getAdminProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT AdminID, Name, Surname, Email, MobileNumber, IsEmailVerified FROM admin WHERE AdminID = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }
    return res.json(formatProfile(rows[0]));
  } catch (err) {
    console.error('getAdminProfile error:', err);
    return res.status(500).json({ message: 'Could not load your profile.' });
  }
};

// PUT /api/admin/profile  (name and surname cannot be changed)
const updateAdminProfile = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = normaliseMobile(req.body.mobile);

    const errors = {};
    if (!email) errors.email = 'Enter your email address.';
    else if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address.';
    else if (email.length > 50) errors.email = 'Email address must be 50 characters or less.';

    if (!mobile) errors.mobile = 'Enter your mobile number.';
    else if (!MOBILE_REGEX.test(mobile)) errors.mobile = 'Enter a valid 10-digit mobile number, e.g. 0820000000.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Please fix the errors below.', errors });
    }

    const [rows] = await pool.query(
      'SELECT AdminID, Name, Surname, Email, MobileNumber, IsEmailVerified FROM admin WHERE AdminID = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }
    const current = rows[0];
    const emailChanged = email !== String(current.Email).toLowerCase();

    if (emailChanged) {
      const [taken] = await pool.query(
        'SELECT AdminID FROM admin WHERE Email = ? AND AdminID <> ?',
        [email, req.user.id]
      );
      if (taken.length > 0) {
        return res.status(409).json({
          message: 'Please fix the errors below.',
          errors: { email: 'This email address is already in use.' },
        });
      }
    }

    if (emailChanged) {
      // Email changed: must be verified again (same OTP flow as POST /api/auth/verify-email)
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      // NOTE: store the OTP the same way authController.js does (plain or hashed).
      await pool.query(
        `UPDATE admin
            SET Email = ?, MobileNumber = ?, IsEmailVerified = 0,
                EmailOTP = ?, EmailOTPExpiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
          WHERE AdminID = ?`,
        [email, mobile, otp, req.user.id]
      );
      // TODO: send `otp` to the new email using the same mail helper authController.js uses
      console.log(`[DEV] Email verification OTP for admin ${req.user.id}: ${otp}`);
    } else {
      await pool.query(
        'UPDATE admin SET MobileNumber = ? WHERE AdminID = ?',
        [mobile, req.user.id]
      );
    }

    const [updated] = await pool.query(
      'SELECT AdminID, Name, Surname, Email, MobileNumber, IsEmailVerified FROM admin WHERE AdminID = ?',
      [req.user.id]
    );

    return res.json({
      message: emailChanged
        ? 'Profile saved. Please verify your new email address.'
        : 'Profile saved.',
      emailChanged,
      profile: formatProfile(updated[0]),
    });
  } catch (err) {
    console.error('updateAdminProfile error:', err);
    return res.status(500).json({ message: 'Could not save your profile.' });
  }
};

// PUT /api/admin/change-password
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Enter your current password.';
    if (!newPassword) errors.newPassword = 'Enter a new password.';
    else if (!PASSWORD_REGEX.test(newPassword)) {
      errors.newPassword = 'Use at least 8 characters with an uppercase letter, a lowercase letter and a number.';
    } else if (currentPassword && newPassword === currentPassword) {
      errors.newPassword = 'The new password must be different from your current password.';
    }
    if (!confirmPassword) errors.confirmPassword = 'Confirm your new password.';
    else if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Please fix the errors below.', errors });
    }

    const [rows] = await pool.query(
      'SELECT PasswordHash FROM admin WHERE AdminID = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    const matches = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
    if (!matches) {
      return res.status(400).json({
        message: 'Please fix the errors below.',
        errors: { currentPassword: 'Current password is incorrect.' },
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admin SET PasswordHash = ? WHERE AdminID = ?', [hash, req.user.id]);

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('changeAdminPassword error:', err);
    return res.status(500).json({ message: 'Could not change your password.' });
  }
};

module.exports = { getAdminProfile, updateAdminProfile, changeAdminPassword };