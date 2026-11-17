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
      
      // Generate Email OTP
      const emailOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 mins

      const insertQuery = `INSERT INTO Owner (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
            db.query(insertQuery, [name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 2, emailOtp, otpExpiry], async (err, result) => { // <-- Add 'async' here
        if (err) return res.status(500).json({ message: "Error creating user in database" });
        
        // Send the REAL email
        await sendOTPEmail(email, emailOtp);

        // Send response to frontend (Removed test_email_otp for security)
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

      // Generate Email OTP
      const emailOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60000);

      // Note the insertQuery includes CompanyName
      const insertQuery = `INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      // Note the parameters here match the query above correctly
      db.query(insertQuery, [companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 4, emailOtp, otpExpiry], async (err, result) => {
        if (err) {
          console.error("🚨 SUPPLIER DB ERROR:", err); // Added this to see errors in terminal
          return res.status(500).json({ message: "Error creating supplier in database" });
        }
        
        // Send the REAL email
        await sendOTPEmail(email, emailOtp);

        // Corrected message
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

    // Mark email as verified and clear OTP
    const updateQuery = `UPDATE ${tableName} SET IsEmailVerified = 1, EmailOTP = NULL, EmailOTPExpiry = NULL WHERE Email = ?`;
    db.query(updateQuery, [email], (err, result) => {
      if (err) return res.status(500).json({ message: "Error verifying email" });
      res.status(200).json({ message: "Email verified successfully! You can now log in." });
    });
  });
};

// --- LOGIN (Keep as is) ---
exports.login = async (req, res) => { /* ... Keep your existing login code here ... */ };
exports.requestOTP = (req, res) => { /* ... Keep your existing SMS OTP code here ... */ };
exports.resetPassword = async (req, res) => { /* ... Keep your existing reset code here ... */ };