const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MySQL Database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'RuralDigitalRetailDB'
});

db.connect((err) => {
  if (err) console.error('Database connection failed: ' + err.stack);
  else console.log('Connected to MySQL database.');
});

// ==========================================
// MIDDLEWARE: Verify JWT Token & Check Role
// ==========================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_mvp_key', (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token." });
    req.user = decoded;
    next();
  });
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Access Denied. Requires ${role} role.` });
    }
    next();
  };
};

// ==========================================
// 2. REGISTRATION ENDPOINT (OWNER)
// ==========================================
app.post('/api/auth/register/owner', async (req, res) => {
  const { name, surname, email, mobileNumber, gender, disability, disabilityDescription, password } = req.body;

  try {
    const checkEmailQuery = 'SELECT * FROM Owner WHERE Email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length > 0) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

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
    const checkEmailQuery = 'SELECT * FROM Supplier WHERE Email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length > 0) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

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
    let tableName = '';
    if (role === 'OWNER') tableName = 'Owner';
    else if (role === 'STAFF') tableName = 'Staff';
    else if (role === 'ADMIN') tableName = 'Admin';
    else if (role === 'SUPPLIER') tableName = 'Supplier';
    else return res.status(400).json({ message: "Invalid role" });

    const query = `SELECT * FROM ${tableName} WHERE Email = ?`;
    db.query(query, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];

      if (!user.IsActive) {
        return res.status(403).json({ message: "Account disabled. Contact Administrator." });
      }

      const isMatch = await bcrypt.compare(password, user.PasswordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

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
// 4. REQUEST OTP (FORGOT PASSWORD)
// ==========================================
app.post('/api/auth/forgot-password/request-otp', (req, res) => {
  const { mobileNumber, role } = req.body;
  
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';

  const checkUserQuery = `SELECT * FROM ${tableName} WHERE MobileNumber = ?`;
  
  db.query(checkUserQuery, [mobileNumber], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    
    if (results.length === 0) {
      return res.status(200).json({ message: "If this number is registered, an OTP has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 15 * 60000); 

    const updateQuery = `UPDATE ${tableName} SET ResetOTP = ?, ResetOTPExpiry = ? WHERE MobileNumber = ?`;
    
    db.query(updateQuery, [otp, expiryTime, mobileNumber], (err, result) => {
      if (err) return res.status(500).json({ message: "Error saving OTP" });

      console.log(`\n=========================================`);
      console.log(`📱 SMS TO ${mobileNumber}: Your OTP is ${otp}`);
      console.log(`=========================================\n`);

      res.status(200).json({ 
        message: "OTP sent successfully (Check Backend Console for testing)", 
        test_otp: otp 
      });
    });
  });
});

// ==========================================
// 5. VERIFY OTP & RESET PASSWORD
// ==========================================
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  const { mobileNumber, otp, newPassword, role } = req.body;
  
  let tableName = role === 'OWNER' ? 'Owner' : 'Supplier';

  try {
    const query = `SELECT * FROM ${tableName} WHERE MobileNumber = ? AND ResetOTP = ? AND ResetOTPExpiry > NOW()`;
    
    db.query(query, [mobileNumber, otp], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      
      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

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
});

// ==========================================
// 6. ADMIN DASHBOARD ROUTE
// ==========================================
app.get('/api/admin/dashboard', verifyToken, authorizeRole('ADMIN'), (req, res) => {
  const queries = {
    owners: 'SELECT COUNT(*) AS total FROM Owner',
    suppliers: 'SELECT COUNT(*) AS total FROM Supplier',
    stores: 'SELECT COUNT(*) AS total FROM Stores'
  };

  db.query(queries.owners, (err, ownerResult) => {
    if (err) return res.status(500).json({ message: "Error fetching owners" });
    
    db.query(queries.suppliers, (err, supplierResult) => {
      if (err) return res.status(500).json({ message: "Error fetching suppliers" });
      
      db.query(queries.stores, (err, storeResult) => {
        const totalStores = err ? 0 : storeResult[0].total;

        res.status(200).json({
          message: "Welcome to the Admin Dashboard",
          stats: {
            totalOwners: ownerResult[0].total,
            totalSuppliers: supplierResult[0].total,
            totalStores: totalStores
          }
        });
      });
    });
  });
});

// ==========================================
// 7. STORE OWNER DASHBOARD ROUTE
// ==========================================
app.get('/api/owner/dashboard', verifyToken, authorizeRole('OWNER'), (req, res) => {
  const ownerId = req.user.id;
  const query = 'SELECT Name, Surname, Email FROM Owner WHERE OwnerID = ?';

  db.query(query, [ownerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Owner not found" });

    const owner = results[0];

    res.status(200).json({
      message: `Welcome back, ${owner.Name}!`,
      profile: {
        fullName: `${owner.Name} ${owner.Surname}`,
        email: owner.Email
      },
      stats: {
        todaySales: 0,
        lowStockItems: 0
      }
    });
  });
});

// ==========================================
// 8. SUPPLIER DASHBOARD ROUTE
// ==========================================
app.get('/api/supplier/dashboard', verifyToken, authorizeRole('SUPPLIER'), (req, res) => {
  const supplierId = req.user.id;
  const query = 'SELECT CompanyName, Name FROM Supplier WHERE SupplierID = ?';

  db.query(query, [supplierId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Supplier not found" });

    const supplier = results[0];

    res.status(200).json({
      message: `Welcome back, ${supplier.CompanyName}!`,
      profile: {
        companyName: supplier.CompanyName,
        contactPerson: supplier.Name
      },
      stats: {
        pendingRequests: 0,
        submittedQuotes: 0
      }
    });
  });
});

// ==========================================
// 9. START SERVER
// ==========================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});