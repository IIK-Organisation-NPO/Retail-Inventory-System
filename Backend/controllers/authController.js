const sendOTPEmail = require('../config/email');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper function to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- REGISTER OWNER ---
exports.registerOwner = async (req, res) => {
  const { name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;
  try {
    const checkEmailQuery = 'SELECT * FROM Owner WHERE Email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length > 0) return res.status(400).json({ message: "Email is already registered" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const emailOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 mins

      const insertQuery = `INSERT INTO Owner (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.query(insertQuery, [name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 2, emailOtp, otpExpiry], async (err, result) => {
        if (err) {
          console.error("OWNER DB ERROR:", err);
          return res.status(500).json({ message: "Error creating user in database" });
        }
        
        await sendOTPEmail(email, emailOtp);
        res.status(201).json({ message: "Owner registered. Please verify your email." });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- REGISTER SUPPLIER ---
exports.registerSupplier = async (req, res) => {
  const { companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;
  try {
    const checkEmailQuery = 'SELECT * FROM Supplier WHERE Email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length > 0) return res.status(400).json({ message: "Email is already registered" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const emailOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60000);

      const insertQuery = `INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.query(insertQuery, [companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 4, emailOtp, otpExpiry], async (err, result) => {
        if (err) {
          console.error("SUPPLIER DB ERROR:", err);
          return res.status(500).json({ message: "Error creating supplier in database" });
        }
        
        await sendOTPEmail(email, emailOtp);
        res.status(201).json({ message: "Supplier registered. Please verify your email." });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- VERIFY EMAIL OTP ---
exports.verifyEmail = (req, res) => {
  const { email, otp, role } = req.body;
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';

  const query = `SELECT * FROM ${tableName} WHERE Email = ? AND EmailOTP = ? AND EmailOTPExpiry > NOW()`;
  
  db.query(query, [email, otp], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(400).json({ message: "Invalid or expired OTP" });

    const updateQuery = `UPDATE ${tableName} SET IsEmailVerified = 1, EmailOTP = NULL, EmailOTPExpiry = NULL WHERE Email = ?`;
    db.query(updateQuery, [email], (err, result) => {
      if (err) return res.status(500).json({ message: "Error verifying email" });
      res.status(200).json({ message: "Email verified successfully! You can now log in." });
    });
  });
};

// --- HELPER: Process Login (Keeps code clean) ---
const processLogin = async (user, actualRole, res) => {
  if (!user.IsActive) {
    return res.status(403).json({ message: "Account disabled. Contact Administrator." });
  }

  const isMatch = await bcrypt.compare(user.Password || user.PasswordHash, user.PasswordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Find the correct ID column based on role
  const userId = user.OwnerID || user.StaffID || user.AdminID || user.SupplierID;
  
  const token = jwt.sign(
    { id: userId, role: actualRole },
    process.env.JWT_SECRET || 'super_secret_mvp_key', 
    { expiresIn: '1d' }
  );

  res.status(200).json({ 
    message: "Login successful", 
    token: token, 
    role: actualRole, 
    user: { name: user.Name, surname: user.Surname }
  });
};

// --- LOGIN ---
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let tableName = '';
    if (role === 'OWNER') tableName = 'Owner';
    else if (role === 'STAFF') tableName = 'Staff';
    else if (role === 'ADMIN') tableName = 'Admin';
    else if (role === 'SUPPLIER') tableName = 'Supplier';
    else if (role === 'STORE') tableName = 'Owner'; // Start with Owner table for unified Store login
    else return res.status(400).json({ message: "Invalid role" });

    const query = `SELECT * FROM ${tableName} WHERE Email = ?`;
    
    db.query(query, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      // If role is "STORE" and not found in Owner table, check Staff table
      if (results.length === 0 && role === 'STORE') {
        const staffQuery = 'SELECT * FROM Staff WHERE Email = ?';
        return db.query(staffQuery, [email], async (staffErr, staffResults) => {
          if (staffErr) return res.status(500).json({ message: "Database error" });
          if (staffResults.length === 0) return res.status(401).json({ message: "Invalid email or password" });
          
          processLogin(staffResults[0], 'STAFF', res);
        });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // If found in Owner table (or other standard roles)
      processLogin(results[0], role === 'STORE' ? 'OWNER' : role, res);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- REQUEST OTP ---
exports.requestOTP = (req, res) => {
  const { mobileNumber, role } = req.body;
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';

  const checkUserQuery = `SELECT * FROM ${tableName} WHERE MobileNumber = ?`;
  db.query(checkUserQuery, [mobileNumber], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(200).json({ message: "If this number is registered, an OTP has been sent." });

    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 15 * 60000); 
    const updateQuery = `UPDATE ${tableName} SET ResetOTP = ?, ResetOTPExpiry = ? WHERE MobileNumber = ?`;
    
    db.query(updateQuery, [otp, expiryTime, mobileNumber], (err, result) => {
      if (err) return res.status(500).json({ message: "Error saving OTP" });
      console.log(`\n📱 SMS TO ${mobileNumber}: Your OTP is ${otp}\n`);
      res.status(200).json({ message: "OTP sent successfully (Check Backend Console)", test_otp: otp });
    });
  });
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  const { mobileNumber, otp, newPassword, role } = req.body;
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';

  try {
    const query = `SELECT * FROM ${tableName} WHERE MobileNumber = ? AND ResetOTP = ? AND ResetOTPExpiry > NOW()`;
    db.query(query, [mobileNumber, otp], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(400).json({ message: "Invalid or expired OTP" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const updateQuery = `UPDATE ${tableName} SET PasswordHash = ?, ResetOTP = NULL, ResetOTPExpiry = NULL WHERE MobileNumber = ?`;
      
      db.query(updateQuery, [hashedPassword, mobileNumber], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating password" });
        res.status(200).json({ message: "Password reset successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};