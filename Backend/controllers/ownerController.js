const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- GET OWNER PROFILE ---
exports.getProfile = async (req, res) => {
  try {
    const ownerId = req.user.id; // From JWT
    
    // We don't select PasswordHash for security
    const [results] = await db.query(
      'SELECT Name, Surname, Email, MobileNumber FROM Owner WHERE OwnerID = ?', 
      [ownerId]
    );

    if (results.length === 0) return res.status(404).json({ message: "Owner not found" });

    res.status(200).json(results[0]);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- UPDATE OWNER PROFILE ---
exports.updateProfile = async (req, res) => {
  const { name, surname, email, mobile } = req.body;
  const ownerId = req.user.id;

  try {
    // Check if the new email is already taken by someone else
    const [existing] = await db.query(
      'SELECT OwnerID FROM Owner WHERE Email = ? AND OwnerID != ?', 
      [email, ownerId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: "That email address is already in use." });
    }

    await db.query(
      'UPDATE Owner SET Name = ?, Surname = ?, Email = ?, MobileNumber = ? WHERE OwnerID = ?',
      [name, surname, email, mobile, ownerId]
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- CHANGE PASSWORD ---
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const ownerId = req.user.id;

  try {
    // 1. Get current hashed password
    const [results] = await db.query('SELECT PasswordHash FROM Owner WHERE OwnerID = ?', [ownerId]);
    if (results.length === 0) return res.status(404).json({ message: "Owner not found" });

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, results[0].PasswordHash);
    if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });

    // 3. Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE Owner SET PasswordHash = ? WHERE OwnerID = ?', [hashedPassword, ownerId]);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};