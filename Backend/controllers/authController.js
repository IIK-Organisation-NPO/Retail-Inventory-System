const sendOTPEmail = require('../config/email');
const sendSMS = require('../config/sms'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to format South African mobile numbers
const getAlternateNumber = (number) => {
  let cleanNum = number.trim().replace(/\s/g, '');
  if (cleanNum.startsWith('0')) return '+27' + cleanNum.substring(1);
  if (cleanNum.startsWith('+27')) return '0' + cleanNum.substring(3);
  return cleanNum;
};

// Helper to get the correct database table based on role
const getTableForRole = (role) => {
  if (role === 'OWNER' || role === 'STORE') return 'Owner';
  if (role === 'STAFF') return 'Staff';
  if (role === 'ADMIN') return 'Admin';
  if (role === 'SUPPLIER') return 'Supplier';
  return null;
};

// Password validation regex (8+ chars, upper, lower, number, special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

// --- REGISTER OWNER ---
exports.registerOwner = async (req, res) => {
  const { name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;
  
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character." });
  }

  try {
    const [existing] = await db.query('SELECT * FROM Owner WHERE Email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email is already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const emailOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60000); 

    await db.query(
      `INSERT INTO Owner (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 2, emailOtp, otpExpiry]
    );
    
    await sendOTPEmail(email, emailOtp);
    res.status(201).json({ message: "Owner registered. Please verify your email." });
  } catch (error) {
    console.error("REGISTER OWNER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- REGISTER SUPPLIER ---
exports.registerSupplier = async (req, res) => {
  const { companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character." });
  }

  try {
    const [existing] = await db.query('SELECT * FROM Supplier WHERE Email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email is already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const emailOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60000);

    await db.query(
      `INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 4, emailOtp, otpExpiry]
    );
    
    await sendOTPEmail(email, emailOtp);
    res.status(201).json({ message: "Supplier registered. Please verify your email." });
  } catch (error) {
    console.error("REGISTER SUPPLIER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- VERIFY EMAIL OTP ---
exports.verifyEmail = async (req, res) => {
  const { email, otp, role } = req.body;
  const tableName = getTableForRole(role);

  if (!tableName) return res.status(400).json({ message: "Invalid role" });

  try {
    const [results] = await db.query(
      `SELECT * FROM ${tableName} WHERE Email = ? AND EmailOTP = ? AND EmailOTPExpiry > NOW()`, 
      [email, otp]
    );
    
    if (results.length === 0) return res.status(400).json({ message: "Invalid or expired OTP" });

    await db.query(
      `UPDATE ${tableName} SET IsEmailVerified = 1, EmailOTP = NULL, EmailOTPExpiry = NULL WHERE Email = ?`, 
      [email]
    );
    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

// --- HELPER: Process Login ---
const processLogin = async (user, actualRole, providedPassword, res) => {
  try {
    if (!user.IsActive) return res.status(403).json({ message: "Account disabled. Contact Administrator." });
    if (!user.PasswordHash) return res.status(500).json({ message: "Database error: Missing password hash" });

    const isMatch = await bcrypt.compare(providedPassword, user.PasswordHash);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const userId = user.OwnerID || user.StaffID || user.AdminID || user.SupplierID;
    const token = jwt.sign(
      { id: userId, role: actualRole },
      process.env.JWT_SECRET || 'super_secret_mvp_key', 
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: actualRole,
      user: {
        id: userId,
        name: user.Name,
        surname: user.Surname,
        email: user.Email,
        companyName: user.CompanyName || null, // ← new
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const tableName = getTableForRole(role);
    if (!tableName) return res.status(400).json({ message: "Invalid role" });

    const [results] = await db.query(`SELECT * FROM ${tableName} WHERE Email = ?`, [email]);
    
    if (results.length === 0 && role === 'STORE') {
      const [staffResults] = await db.query('SELECT * FROM Staff WHERE Email = ?', [email]);
      
      if (staffResults.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      return await processLogin(staffResults[0], 'STAFF', password, res);
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return await processLogin(results[0], role === 'STORE' ? 'OWNER' : role, password, res);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- REQUEST OTP (FORGOT PASSWORD) ---
exports.requestOTP = async (req, res) => {
  const { mobileNumber, role } = req.body;
  const tableName = getTableForRole(role);
  
  if (!tableName) return res.status(400).json({ message: "Invalid role" });

  const altNumber = getAlternateNumber(mobileNumber);

  try {
    const [results] = await db.query(`SELECT * FROM ${tableName} WHERE MobileNumber = ? OR MobileNumber = ?`, [mobileNumber, altNumber]);
    
    // Security: Don't reveal if number exists or not
    if (results.length === 0) return res.status(200).json({ message: "If this number is registered, an OTP has been sent." });

    const user = results[0];
    const userId = user.OwnerID || user.AdminID || user.StaffID || user.SupplierID;
    const dbNumber = user.MobileNumber;

    // 1. Generate OTP and Hash it
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);
    const expiryTime = new Date(Date.now() + 15 * 60000); 

    // 2. Insert into the new PasswordReset table
    await db.query(
      `INSERT INTO PasswordReset (UserType, ${role}ID, ResetMethod, Destination, OTPHash, ExpiresAt) 
       VALUES (?, ?, 'SMS', ?, ?, ?)`,
      [role, userId, dbNumber, hashedOtp, expiryTime]
    );

    // 3. Send SMS (Pass the plain OTP, not the hash)
    await sendSMS(dbNumber, otp);
    
    res.status(200).json({ message: "OTP sent successfully", test_otp: otp });
  } catch (error) {
    console.error("REQUEST OTP ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  const { mobileNumber, otp, newPassword, role } = req.body;
  const tableName = getTableForRole(role);

  if (!tableName) return res.status(400).json({ message: "Invalid role" });
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character." });
  }

  const altNumber = getAlternateNumber(mobileNumber);

  try {
    // 1. Find the latest valid reset request
    const [resetResults] = await db.query(
      `SELECT * FROM PasswordReset 
       WHERE UserType = ? AND (Destination = ? OR Destination = ?) 
         AND ExpiresAt > NOW() AND IsUsed = FALSE
       ORDER BY CreatedAt DESC LIMIT 1`, 
      [role, mobileNumber, altNumber]
    );
    
    if (resetResults.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const resetRequest = resetResults[0];

    // 2. Compare the provided OTP with the hash in the database
    const isValidOTP = await bcrypt.compare(otp, resetRequest.OTPHash);
    if (!isValidOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 4. Dynamically get the correct ID column based on role
    const userIdColumn = `${role === 'STORE' ? 'Owner' : role}ID`; 
    const userId = resetRequest[userIdColumn]; 

    // 5. Update the user's password
    await db.query(`UPDATE ${tableName} SET PasswordHash = ? WHERE ${userIdColumn} = ?`, [hashedPassword, userId]);

    // 6. Mark the OTP as used
    await db.query(`UPDATE PasswordReset SET IsUsed = TRUE WHERE ResetID = ?`, [resetRequest.ResetID]);
    
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};