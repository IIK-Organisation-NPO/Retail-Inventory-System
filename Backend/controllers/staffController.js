const db = require('../config/db');

// --- GET ALL STAFF FOR A STORE ---
exports.getStaff = async (req, res) => {
  const { storeId } = req.query;
  try {
    const [staff] = await db.query(
      'SELECT StaffID as id, Name as name, Surname as surname, Email as email, MobileNumber as mobile, Role as role, IsActive FROM Staff WHERE StoreID = ?',
      [storeId]
    );
    res.status(200).json(staff);
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- ADD NEW STAFF ---
exports.addStaff = async (req, res) => {
  const { storeId, name, surname, email, mobile, role, gender } = req.body;

  if (!storeId || !name || !surname || !email || !mobile) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1. Check if email is already in use
    const [existing] = await db.query('SELECT StaffID FROM Staff WHERE Email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "This email is already registered to another user." });
    }

    // 2. Insert new staff (PasswordHash is NULL for now; they will set it via email invite later)
    const [result] = await db.query(
      `INSERT INTO Staff (StoreID, Name, Surname, Email, MobileNumber, Role, IsActive) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [storeId, name, surname, email, mobile, role || 'Cashier']
    );

    res.status(201).json({ message: "Staff added successfully", staffId: result.insertId });
  } catch (error) {
    console.error("ADD STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- TOGGLE STAFF STATUS (Active / Disabled) ---
exports.toggleStaffStatus = async (req, res) => {
  const { staffId } = req.params;
  const { isActive } = req.body;

  try {
    await db.query('UPDATE Staff SET IsActive = ? WHERE StaffID = ?', [isActive, staffId]);
    res.status(200).json({ message: `Staff account ${isActive ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error("TOGGLE STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Required for hashing the 6-digit code

// --- GET ALL STAFF FOR A STORE ---
exports.getStaff = async (req, res) => {
  const { storeId } = req.query;
  try {
    const [staff] = await db.query(
      'SELECT StaffID as id, Name as name, Surname as surname, Email as email, MobileNumber as mobile, Role as role, IsActive FROM Staff WHERE StoreID = ?',
      [storeId]
    );
    res.status(200).json(staff);
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- ADD NEW STAFF ---
exports.addStaff = async (req, res) => {
  const { storeId, name, surname, email, mobile, role, password } = req.body;

  // Validate required fields (password is the 6-digit code)
  if (!storeId || !name || !surname || !mobile || !password) {
    return res.status(400).json({ message: "Missing required fields (including password code)" });
  }

  try {
    // 1. Check if email is already in use (only if an email was provided)
    if (email) {
      const [existing] = await db.query('SELECT StaffID FROM Staff WHERE Email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "This email is already registered to another user." });
      }
    }

    // 2. Hash the 6-digit code
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(password, salt);

    // 3. Insert new staff with the hashed password
    const [result] = await db.query(
      `INSERT INTO Staff (StoreID, Name, Surname, Email, MobileNumber, PasswordHash, Role, IsActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [storeId, name, surname, email || null, mobile, hashedCode, role || 'Cashier']
    );

    res.status(201).json({ message: "Staff added successfully", staffId: result.insertId });
  } catch (error) {
    console.error("ADD STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- UPDATE EXISTING STAFF ---
exports.updateStaff = async (req, res) => {
  const { staffId } = req.params;
  const { name, surname, email, mobile, role, password } = req.body;

  try {
    // If a new 6-digit code was typed in, hash it and update it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(password, salt);
      
      await db.query(
        `UPDATE Staff SET Name = ?, Surname = ?, Email = ?, MobileNumber = ?, Role = ?, PasswordHash = ? WHERE StaffID = ?`,
        [name, surname, email || null, mobile, role, hashedCode, staffId]
      );
    } else {
      // Update details without changing the password/code
      await db.query(
        `UPDATE Staff SET Name = ?, Surname = ?, Email = ?, MobileNumber = ?, Role = ? WHERE StaffID = ?`,
        [name, surname, email || null, mobile, role, staffId]
      );
    }
    
    res.status(200).json({ message: "Staff updated successfully" });
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- TOGGLE STAFF STATUS (Active / Disabled) ---
exports.toggleStaffStatus = async (req, res) => {
  const { staffId } = req.params;
  const { isActive } = req.body;

  try {
    await db.query('UPDATE Staff SET IsActive = ? WHERE StaffID = ?', [isActive, staffId]);
    res.status(200).json({ message: `Staff account ${isActive ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error("TOGGLE STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};