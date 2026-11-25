const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to check if code is sequential or repeating
const isSequentialOrRepeating = (code) => {
  if (/^(\d)\1{5}$/.test(code)) return true; // 111111
  if ("0123456789".includes(code)) return true; // 012345, 123456
  if ("9876543210".includes(code)) return true; // 987654, 876543
  return false;
};

// --- GET ALL STAFF FOR A STORE ---
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

// --- ADD NEW STAFF ---
exports.addStaff = async (req, res) => {
  const { storeId, name, surname, gender, email, mobile, role, password, hasDisability, disabilityType } = req.body;

  if (!storeId || !name || !surname || !mobile || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 1. Validate the 6-digit code format
  if (isSequentialOrRepeating(password)) {
    return res.status(400).json({ 
      message: "Can not proceed ascending/descending order or (e.g. 6 same number (111111)", 
      field: "code" 
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 2. Check if email OR mobile is already in use
    if (email) {
      const [existingEmail] = await connection.query('SELECT StaffID FROM Staff WHERE Email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: "This user already exist", field: "email" });
      }
    }
    
    const [existingMobile] = await connection.query('SELECT StaffID FROM Staff WHERE MobileNumber = ?', [mobile]);
    if (existingMobile.length > 0) {
      return res.status(409).json({ message: "This user already exist", field: "mobile" });
    }

    // 3. Hash the 6-digit code
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(password, salt);

    // 4. Map Role string to RoleID (Assuming Staff = 3 based on your schema)
    const roleId = 3; 

    // 5. Insert into Staff table matching your exact schema
    const [result] = await connection.query(
      `INSERT INTO Staff (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, surname, email || null, mobile, gender || 'other', hasDisability || false, disabilityType || null, hashedCode, roleId]
    );
    const newStaffId = result.insertId;

    // 6. Link to Store
    await connection.query(
      `INSERT INTO StoreUsers (StoreID, StaffID, IsActive) VALUES (?, ?, 1)`,
      [storeId, newStaffId]
    );

    await connection.commit();
    res.status(201).json({ message: "Staff added successfully", staffId: newStaffId });

  } catch (error) {
    await connection.rollback();
    console.error("ADD STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  } finally {
    connection.release();
  }
};

// --- UPDATE EXISTING STAFF ---
exports.updateStaff = async (req, res) => {
  const { staffId } = req.params;
  const { name, surname, email, mobile, role, password } = req.body;

  try {
    if (password) {
      if (isSequentialOrRepeating(password)) {
        return res.status(400).json({ 
          message: "Can not proceed ascending/descending order or (e.g. 6 same number (111111)", 
          field: "code" 
        });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(password, salt);
      
      await db.query(
        `UPDATE Staff SET Name = ?, Surname = ?, Email = ?, MobileNumber = ?, PasswordHash = ? WHERE StaffID = ?`,
        [name, surname, email || null, mobile, hashedCode, staffId]
      );
    } else {
      await db.query(
        `UPDATE Staff SET Name = ?, Surname = ?, Email = ?, MobileNumber = ? WHERE StaffID = ?`,
        [name, surname, email || null, mobile, staffId]
      );
    }
    
    res.status(200).json({ message: "Staff updated successfully" });
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- OTHER FUNCTIONS (Keep as is) ---
exports.toggleStaffStatus = async (req, res) => {
  const { staffId } = req.params;
  const { isActive, storeId } = req.body; 
  try {
    await db.query('UPDATE StoreUsers SET IsActive = ? WHERE StaffID = ? AND StoreID = ?', [isActive, staffId, storeId]);
    res.status(200).json({ message: `Staff account ${isActive ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const [staff] = await db.query('SELECT StaffID, Name, Surname, Email, MobileNumber FROM Staff WHERE StaffID = ?', [req.user.id]);
    if (staff.length === 0) return res.status(404).json({ message: "Staff member not found" });
    res.status(200).json(staff[0]);
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

exports.updateMyProfile = async (req, res) => {
  const { name, surname, mobile } = req.body;
  try {
    await db.query('UPDATE Staff SET Name = ?, Surname = ?, MobileNumber = ? WHERE StaffID = ?', [name, surname, mobile, req.user.id]);
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};