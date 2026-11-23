const db = require('../config/db');
const bcrypt = require('bcryptjs');

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

// --- UPDATE EXISTING STAFF (Used by Owner in Staff Management) ---
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

// --- GET LOGGED-IN STAFF PROFILE (Used by Staff My Account) ---
exports.getMyProfile = async (req, res) => {
  try {
    // req.user.id comes from the JWT token
    const [staff] = await db.query(
      'SELECT StaffID, Name, Surname, Email, MobileNumber, Role FROM Staff WHERE StaffID = ?',
      [req.user.id]
    );
    
    if (staff.length === 0) return res.status(404).json({ message: "Staff member not found" });
    
    res.status(200).json(staff[0]);
  } catch (error) {
    console.error("GET STAFF PROFILE ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- UPDATE LOGGED-IN STAFF PROFILE (Used by Staff My Account) ---
exports.updateMyProfile = async (req, res) => {
  const { name, surname, mobile } = req.body;
  
  try {
    await db.query(
      'UPDATE Staff SET Name = ?, Surname = ?, MobileNumber = ? WHERE StaffID = ?',
      [name, surname, mobile, req.user.id]
    );
    
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("UPDATE STAFF PROFILE ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};