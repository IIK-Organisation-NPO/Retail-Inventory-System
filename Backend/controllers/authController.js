const sendOTPEmail = require('../config/email');
const sendSMS = require('../config/sms'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getAlternateNumber = (number) => {
  let cleanNum = number.trim().replace(/\s/g, '');
  if (cleanNum.startsWith('0')) return '+27' + cleanNum.substring(1);
  if (cleanNum.startsWith('+27')) return '0' + cleanNum.substring(3);
  return cleanNum;
};

// --- REGISTER OWNER ---
exports.registerOwner = async (req, res) => {
  const { name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;
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
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';

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
    
    // FIXED: Specific error for wrong password (401)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password or passcode" });
    }

    const userId = user.OwnerID || user.StaffID || user.AdminID || user.SupplierID;
    const token = jwt.sign(
      { id: userId, role: actualRole },
      process.env.JWT_SECRET || 'super_secret_mvp_key', 
      { expiresIn: '1d' }
    );

    res.status(200).json({ message: "Login successful", token, role: actualRole, user: { name: user.Name, surname: user.Surname } });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    let tableName = '';
    if (role === 'OWNER' || role === 'STORE') tableName = 'Owner';
    else if (role === 'STAFF') tableName = 'Staff';
    else if (role === 'ADMIN') tableName = 'Admin';
    else if (role === 'SUPPLIER') tableName = 'Supplier';
    else return res.status(400).json({ message: "Invalid role" });

    const [results] = await db.query(`SELECT * FROM ${tableName} WHERE Email = ?`, [email]);
    
    if (results.length === 0 && role === 'STORE') {
      const [staffResults] = await db.query('SELECT * FROM Staff WHERE Email = ?', [email]);
      
      // FIXED: Specific error for email not found (404)
      if (staffResults.length === 0) {
        return res.status(404).json({ message: "Please enter required email address or mobile number" });
      }
      
      return await processLogin(staffResults[0], 'STAFF', password, res);
    }

    // FIXED: Specific error for email not found (404)
    if (results.length === 0) {
      return res.status(404).json({ message: "Please enter required email address or mobile number" });
    }

    return await processLogin(results[0], role === 'STORE' ? 'OWNER' : role, password, res);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- REQUEST OTP (FORGOT PASSWORD) ---
exports.requestOTP = async (req, res) => {
  const { mobileNumber, role } = req.body;
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';
  const altNumber = getAlternateNumber(mobileNumber);

  try {
    const [results] = await db.query(`SELECT * FROM ${tableName} WHERE MobileNumber = ? OR MobileNumber = ?`, [mobileNumber, altNumber]);
    
    if (results.length === 0) return res.status(200).json({ message: "If this number is registered, an OTP has been sent." });

    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 15 * 60000); 
    const dbNumber = results[0].MobileNumber;
    
    await db.query(`UPDATE ${tableName} SET ResetOTP = ?, ResetOTPExpiry = ? WHERE MobileNumber = ?`, [otp, expiryTime, dbNumber]);
    await sendSMS(dbNumber, otp);
    
    res.status(200).json({ message: "OTP sent successfully", test_otp: otp });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  const { mobileNumber, otp, newPassword, role } = req.body;
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';
  const altNumber = getAlternateNumber(mobileNumber);

  try {
    const [results] = await db.query(
      `SELECT * FROM ${tableName} WHERE (MobileNumber = ? OR MobileNumber = ?) AND ResetOTP = ? AND ResetOTPExpiry > NOW()`, 
      [mobileNumber, altNumber, otp]
    );
    
    if (results.length === 0) return res.status(400).json({ message: "Invalid or expired OTP" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const dbNumber = results[0].MobileNumber; 
    
    await db.query(`UPDATE ${tableName} SET PasswordHash = ?, ResetOTP = NULL, ResetOTPExpiry = NULL WHERE MobileNumber = ?`, [hashedPassword, dbNumber]);
    
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};