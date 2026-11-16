const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Added for Login
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Allow React to talk to this server
app.use(express.json()); // Parse JSON bodies

// 1. Connect to MySQL Database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Your MySQL username
  password: 'root', // Your MySQL password
  database: 'RuralDigitalRetailDB'
});

db.connect((err) => {
  if (err) console.error('Database connection failed: ' + err.stack);
  else console.log('Connected to MySQL database.');
});

// ==========================================
// 2. REGISTRATION ENDPOINT
// ==========================================
app.post('/api/auth/register/owner', async (req, res) => {
  const { name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;

  try {
    // Check if email already exists
    const checkEmailQuery = 'SELECT * FROM Owner WHERE Email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length > 0) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Hash the password (Security requirement NFR-SEC-03)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert into the Owner table (RoleID = 2 for Owner)
      const insertQuery = `
        INSERT INTO Owner (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 2], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error creating user in database" });
        }

        res.status(201).json({ message: "Store Owner registered successfully" });
      });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 2.5 REGISTRATION ENDPOINT (SUPPLIER)
// ==========================================
app.post('/api/auth/register/supplier', async (req, res) => {
  const { companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;

  try {
    // Check if email already exists in Supplier table
    const checkEmailQuery = 'SELECT * FROM Supplier WHERE Email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length > 0) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert into the Supplier table (RoleID = 4 for Supplier)
      const insertQuery = `
        INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [companyName, name, surname, email, mobileNumber, gender, disability, disabilityDescription, hashedPassword, 4], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error creating supplier in database" });
        }

        res.status(201).json({ message: "Supplier registered successfully" });
      });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 3. LOGIN ENDPOINT
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // 1. Determine which table to check based on the role sent from frontend
    let tableName = '';
    if (role === 'OWNER') tableName = 'Owner';
    else if (role === 'STAFF') tableName = 'Staff';
    else if (role === 'ADMIN') tableName = 'Admin';
    else if (role === 'SUPPLIER') tableName = 'Supplier';
    else return res.status(400).json({ message: "Invalid role" });

    // 2. Find the user
    const query = `SELECT * FROM ${tableName} WHERE Email = ?`;
    db.query(query, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length === 0) {
        // Auth Requirement AUTH-12: General error message
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];

      // 3. Check if account is active (Auth Requirement AUTH-13)
      if (!user.IsActive) {
        return res.status(403).json({ message: "Account disabled. Contact Administrator." });
      }

      // 4. Compare Passwords
      const isMatch = await bcrypt.compare(password, user.PasswordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // 5. Generate JWT Token
      // We use OwnerID, StaffID, etc., based on the table
      const userId = user.OwnerID || user.StaffID || user.AdminID || user.SupplierID;
      
      const token = jwt.sign(
        { id: userId, role: role },
        process.env.JWT_SECRET || 'super_secret_mvp_key', 
        { expiresIn: '1d' }
      );

      res.status(200).json({ 
        message: "Login successful", 
        token: token, 
        role: role,
        user: { name: user.Name, surname: user.Surname }
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 4. START SERVER
// ==========================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});