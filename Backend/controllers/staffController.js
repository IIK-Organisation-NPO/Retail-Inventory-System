const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- GET ALL STAFF FOR A STORE (JOIN with StoreUsers) ---
exports.getStaff = async (req, res) => {
  const { storeId } = req.query;
  try {
    const [staff] = await db.query(`
      SELECT 
        s.StaffID as id, 
        s.Name as name, 
        s.Surname as surname, 
        s.Email as email, 
        s.MobileNumber as mobile, 
        s.Role as role, 
        su.IsActive
      FROM Staff s
      JOIN StoreUsers su ON s.StaffID = su.StaffID
      WHERE su.StoreID = ?
    `, [storeId]);
    
    res.status(200).json(staff);
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- ADD NEW STAFF (Insert into Staff AND StoreUsers) ---
exports.addStaff = async (req, res) => {
  const { storeId, name, surname, email, mobile, role, password } = req.body;

  if (!storeId || !name || !surname || !mobile || !password) {
    return res.status(400).json({ message: "Missing required fields (including password code)" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if email is already in use
    if (email) {
      const [existing] = await connection.query('SELECT StaffID FROM Staff WHERE Email = ?', [email]);
      if (existing.length > 0) {
        throw new Error("This email is already registered to another user.");
      }
    }

    // 2. Hash the 6-digit code
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(password, salt);

    // 3. Insert into Staff table (No StoreID or IsActive here anymore)
    const [result] = await connection.query(
      `INSERT INTO Staff (Name, Surname, Email, MobileNumber, PasswordHash, Role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, surname, email || null, mobile, hashedCode, role || 'Cashier']
    );
    const newStaffId = result.insertId;

    // 4. Insert into StoreUsers table to link them to the store
    await connection.query(
      `INSERT INTO StoreUsers (StoreID, StaffID, IsActive) VALUES (?, ?, 1)`,
      [storeId, newStaffId]
    );

    await connection.commit();
    res.status(201).json({ message: "Staff added successfully", staffId: newStaffId });

  } catch (error) {
    await connection.rollback();
    console.error("ADD STAFF ERROR:", error);
    res.status(500).json({ message: error.message || "Database error" });
  } finally {
    connection.release();
  }
};

// --- UPDATE EXISTING STAFF (Updates global Staff details) ---
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

// --- TOGGLE STAFF STATUS (Updates StoreUsers for specific store) ---
exports.toggleStaffStatus = async (req, res) => {
  const { staffId } = req.params;
  // The frontend now sends storeId so we know which assignment to toggle
  const { isActive, storeId } = req.body; 

  try {
    await db.query(
      'UPDATE StoreUsers SET IsActive = ? WHERE StaffID = ? AND StoreID = ?', 
      [isActive, staffId, storeId]
    );
    res.status(200).json({ message: `Staff account ${isActive ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error("TOGGLE STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- GET LOGGED-IN STAFF PROFILE (Used by Staff My Account) ---
exports.getMyProfile = async (req, res) => {
  try {
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