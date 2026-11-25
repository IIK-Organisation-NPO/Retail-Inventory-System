const db = require('../config/db');
const bcrypt = require('bcryptjs');
const sendOTPEmail = require('../config/email');
const {
  validateSupplierProfileUpdate,
  validateCompanyProfileBody,
} = require('../validators/supplierValidator');

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// GET /api/supplier/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const supplierId = req.user && req.user.id;
    const role = req.user && req.user.role;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    // mysql2 throws "Bind parameters must not contain undefined" if the
    // token payload uses a different key (e.g. userId instead of id).
    if (supplierId === undefined || supplierId === null) {
      console.error('SUPPLIER DASHBOARD: req.user has no id. req.user =', req.user);
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }

    const [[profile]] = await db.query(
      `SELECT SupplierID, CompanyName, Name, Surname, Email, MobileNumber,
              IsActive, IsEmailVerified, CreatedAt
         FROM supplier
        WHERE SupplierID = ?`,
      [supplierId]
    );

    if (!profile) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    // Quote stats are optional for the dashboard. If the supplierquotes table
    // or one of its columns is missing, log the real error and fall back to
    // zeros so the profile page still loads.
    let quoteStats = {
      totalQuotes: 0,
      pendingQuotes: 0,
      acceptedQuotes: 0,
      rejectedQuotes: 0,
      acceptedValue: 0,
    };
    let recentQuotes = [];
    let quotesError = null;

    try {
      const [[stats]] = await db.query(
        `SELECT
           COUNT(*)                                            AS totalQuotes,
           SUM(CASE WHEN Status = 'Pending'  THEN 1 ELSE 0 END) AS pendingQuotes,
           SUM(CASE WHEN Status = 'Accepted' THEN 1 ELSE 0 END) AS acceptedQuotes,
           SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) AS rejectedQuotes,
           COALESCE(SUM(CASE WHEN Status = 'Accepted' THEN TotalAmount END), 0) AS acceptedValue
         FROM supplierquotes
         WHERE SupplierID = ?`,
        [supplierId]
      );
      quoteStats = stats;

      const [rows] = await db.query(
        `SELECT QuoteID, RequestID, QuoteDate, TotalAmount, Status
           FROM supplierquotes
          WHERE SupplierID = ?
          ORDER BY QuoteDate DESC
          LIMIT 5`,
        [supplierId]
      );
      recentQuotes = rows;
    } catch (quoteErr) {
      quotesError = quoteErr;
      console.error('SUPPLIER DASHBOARD QUOTES ERROR:', quoteErr);
    }

    const response = {
      supplier: {
        id:              profile.SupplierID,
        companyName:     profile.CompanyName,
        contactName:     `${profile.Name} ${profile.Surname}`.trim(),
        email:           profile.Email,
        mobileNumber:    profile.MobileNumber,
        isActive:        !!profile.IsActive,
        isEmailVerified: !!profile.IsEmailVerified,
        memberSince:     profile.CreatedAt,
      },
      stats: {
        totalQuotes:    Number(quoteStats.totalQuotes)    || 0,
        pendingQuotes:  Number(quoteStats.pendingQuotes)  || 0,
        acceptedQuotes: Number(quoteStats.acceptedQuotes) || 0,
        rejectedQuotes: Number(quoteStats.rejectedQuotes) || 0,
        acceptedValue:  Number(quoteStats.acceptedValue)  || 0,
      },
      recentQuotes,
    };

    if (quotesError) {
      response.quotesDebug = quotesError.message;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('SUPPLIER DASHBOARD ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};

// GET /api/supplier/profile
exports.getProfile = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { role } = req.user;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    const [[profile]] = await db.query(
      `SELECT SupplierID, CompanyName, Name, Surname, Email, MobileNumber,
              IsActive, IsEmailVerified, CreatedAt
         FROM supplier
        WHERE SupplierID = ?`,
      [supplierId]
    );

    if (!profile) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    return res.status(200).json({
      SupplierID:      profile.SupplierID,
      CompanyName:     profile.CompanyName,
      Name:            profile.Name,
      Surname:         profile.Surname,
      Email:           profile.Email,
      MobileNumber:    profile.MobileNumber,
      IsActive:        !!profile.IsActive,
      IsEmailVerified: !!profile.IsEmailVerified,
      CreatedAt:       profile.CreatedAt,
    });
  } catch (err) {
    console.error('SUPPLIER GET PROFILE ERROR:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/supplier/profile
exports.updateProfile = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { role } = req.user;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    const { errors, cleaned } = validateSupplierProfileUpdate(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const [[current]] = await db.query(
      'SELECT CompanyName, Email, MobileNumber FROM supplier WHERE SupplierID = ?',
      [supplierId]
    );
    if (!current) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    const emailChanged = String(current.Email).toLowerCase() !== cleaned.email;
    const mobileChanged = String(current.MobileNumber) !== cleaned.mobile;

    const uniquenessErrors = {};

    if (emailChanged) {
      const [taken] = await db.query(
        'SELECT SupplierID FROM supplier WHERE Email = ? AND SupplierID <> ?',
        [cleaned.email, supplierId]
      );
      if (taken.length > 0) {
        uniquenessErrors.email =
          'This email is already used by another supplier.';
      }
    }

    if (mobileChanged) {
      const [taken] = await db.query(
        'SELECT SupplierID FROM supplier WHERE MobileNumber = ? AND SupplierID <> ?',
        [cleaned.mobile, supplierId]
      );
      if (taken.length > 0) {
        uniquenessErrors.mobile =
          'This mobile number is already used by another supplier.';
      }
    }

    if (Object.keys(uniquenessErrors).length > 0) {
      return res
        .status(409)
        .json({ message: 'Validation failed.', errors: uniquenessErrors });
    }

    if (!emailChanged) {
      await db.query(
        `UPDATE supplier
            SET CompanyName = ?, MobileNumber = ?
          WHERE SupplierID = ?`,
        [cleaned.companyName, cleaned.mobile, supplierId]
      );

      const [[updated]] = await db.query(
        `SELECT SupplierID, CompanyName, Name, Surname, Email, MobileNumber,
                IsActive, IsEmailVerified, CreatedAt
           FROM supplier WHERE SupplierID = ?`,
        [supplierId]
      );

      return res.status(200).json({
        updated: true,
        requiresVerification: false,
        message: 'Profile updated successfully.',
        supplier: {
          id:              updated.SupplierID,
          companyName:     updated.CompanyName,
          contactName:     `${updated.Name} ${updated.Surname}`.trim(),
          email:           updated.Email,
          mobileNumber:    updated.MobileNumber,
          isActive:        !!updated.IsActive,
          isEmailVerified: !!updated.IsEmailVerified,
          memberSince:     updated.CreatedAt,
        },
      });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60000);

    await db.query(
      `UPDATE supplier
          SET CompanyName = ?, Email = ?, MobileNumber = ?,
              IsEmailVerified = 0, EmailOTP = ?, EmailOTPExpiry = ?
        WHERE SupplierID = ?`,
      [cleaned.companyName, cleaned.email, cleaned.mobile, otp, expiry, supplierId]
    );

    sendOTPEmail(cleaned.email, otp).catch((e) =>
      console.error('SEND NEW EMAIL OTP ERROR:', e)
    );

    return res.status(200).json({
      updated: true,
      requiresVerification: true,
      emailChanged: true,
      emailSent: true,
      email: cleaned.email,
      message:
        'Email updated. We sent a 6-digit code to your new email. Please verify it to continue.',
    });
  } catch (err) {
    console.error('SUPPLIER UPDATE PROFILE ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};

// POST /api/supplier/resend-email-otp
exports.resendEmailOTP = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { role } = req.user;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    const [[row]] = await db.query(
      'SELECT Email FROM supplier WHERE SupplierID = ?',
      [supplierId]
    );

    if (!row || !row.Email) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60000);

    await db.query(
      'UPDATE supplier SET EmailOTP = ?, EmailOTPExpiry = ? WHERE SupplierID = ?',
      [otp, expiry, supplierId]
    );

    await sendOTPEmail(row.Email, otp);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (err) {
    console.error('SUPPLIER RESEND OTP ERROR:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/supplier/change-password  (Step 4B)
exports.changePassword = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { role } = req.user;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    const { currentPassword, newPassword } = req.body;

    const [[row]] = await db.query(
      'SELECT PasswordHash, IsActive FROM supplier WHERE SupplierID = ?',
      [supplierId]
    );

    if (!row) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    if (!row.IsActive) {
      return res.status(403).json({
        message: 'Account is inactive. Contact support.',
      });
    }

    if (!row.PasswordHash) {
      console.error('SUPPLIER CHANGE PASSWORD: PasswordHash missing for supplier', supplierId);
      return res.status(500).json({ message: 'Server error.' });
    }

    const matches = await bcrypt.compare(currentPassword, row.PasswordHash);
    if (!matches) {
      return res.status(401).json({
        message: 'Current password is incorrect.',
        errors: { currentPassword: 'Current password is incorrect.' },
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE supplier SET PasswordHash = ? WHERE SupplierID = ?',
      [newHash, supplierId]
    );

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('SUPPLIER CHANGE PASSWORD ERROR:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ------------------------------------------------------------------
// Step 4C — Company Profile persistence
// Stored as JSON columns on supplier:
//   CategoriesJSON, DeliveryAreasJSON, DepotsJSON
// ------------------------------------------------------------------

const parseJsonColumn = (val, fallback) => {
  if (val == null) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return fallback;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// GET /api/supplier/company-profile
// Returns { categories: string[], deliveryAreas: string[], depots: object[] }
exports.getCompanyProfile = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { role } = req.user;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    const [[row]] = await db.query(
      `SELECT CategoriesJSON, DeliveryAreasJSON, DepotsJSON
         FROM supplier
        WHERE SupplierID = ?`,
      [supplierId]
    );

    if (!row) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    return res.status(200).json({
      categories:    parseJsonColumn(row.CategoriesJSON, []),
      deliveryAreas: parseJsonColumn(row.DeliveryAreasJSON, []),
      depots:        parseJsonColumn(row.DepotsJSON, []),
    });
  } catch (err) {
    console.error('SUPPLIER GET COMPANY PROFILE ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
    });
  }
};

// PUT /api/supplier/company-profile
// Body (all optional, partial update):
//   { categories?: string[], deliveryAreas?: string[], depots?: object[] }
// Missing keys leave the corresponding column untouched.
exports.updateCompanyProfile = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { role } = req.user;

    if (role !== 'SUPPLIER') {
      return res.status(403).json({ message: 'Access denied. Supplier role required.' });
    }

    const { errors, cleaned } = validateCompanyProfileBody(req.body || {});
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    // Build dynamic SET so partial updates work.
    const sets = [];
    const params = [];

    if (cleaned.categories !== undefined) {
      sets.push('CategoriesJSON = ?');
      params.push(JSON.stringify(cleaned.categories));
    }
    if (cleaned.deliveryAreas !== undefined) {
      sets.push('DeliveryAreasJSON = ?');
      params.push(JSON.stringify(cleaned.deliveryAreas));
    }
    if (cleaned.depots !== undefined) {
      // Assign ids where missing (frontend may send id; if not, generate one).
      const withIds = cleaned.depots.map((d) => ({
        id: typeof d.id === 'number' ? d.id : Date.now() + Math.floor(Math.random() * 1000),
        name: d.name,
        address: d.address,
        municipality: d.municipality,
        contact: d.contact,
      }));
      sets.push('DepotsJSON = ?');
      params.push(JSON.stringify(withIds));
    }

    if (sets.length === 0) {
      // Nothing to update — just echo current state.
      const [[row]] = await db.query(
        `SELECT CategoriesJSON, DeliveryAreasJSON, DepotsJSON
           FROM supplier WHERE SupplierID = ?`,
        [supplierId]
      );
      if (!row) {
        return res.status(404).json({ message: 'Supplier profile not found.' });
      }
      return res.status(200).json({
        message: 'Nothing to update.',
        categories:    parseJsonColumn(row.CategoriesJSON, []),
        deliveryAreas: parseJsonColumn(row.DeliveryAreasJSON, []),
        depots:        parseJsonColumn(row.DepotsJSON, []),
      });
    }

    params.push(supplierId);

    const [result] = await db.query(
      `UPDATE supplier SET ${sets.join(', ')} WHERE SupplierID = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier profile not found.' });
    }

    // Return the canonical post-save state.
    const [[row]] = await db.query(
      `SELECT CategoriesJSON, DeliveryAreasJSON, DepotsJSON
         FROM supplier WHERE SupplierID = ?`,
      [supplierId]
    );

    return res.status(200).json({
      message: 'Company profile saved.',
      categories:    parseJsonColumn(row.CategoriesJSON, []),
      deliveryAreas: parseJsonColumn(row.DeliveryAreasJSON, []),
      depots:        parseJsonColumn(row.DepotsJSON, []),
    });
  } catch (err) {
    console.error('SUPPLIER UPDATE COMPANY PROFILE ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};