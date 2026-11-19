const db = require('../config/db');

// Default settings if the user hasn't saved any yet
const DEFAULT_PREFERENCES = {
  lowStock: { app: true, email: true },
  supplierQuote: { app: true, email: false },
  procurementUpdates: { app: null, email: true },
  announcements: { app: true, email: null },
};

// --- GET SETTINGS ---
exports.getSettings = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const [results] = await db.query('SELECT Preferences FROM OwnerSettings WHERE OwnerID = ?', [ownerId]);
    
    if (results.length === 0) {
      // No settings found, return defaults
      return res.status(200).json(DEFAULT_PREFERENCES);
    }

    // MySQL returns JSON as an object automatically with mysql2
    res.status(200).json(results[0].Preferences);
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- SAVE SETTINGS ---
exports.saveSettings = async (req, res) => {
  const ownerId = req.user.id;
  const preferences = req.body;

  try {
    // Use INSERT ... ON DUPLICATE KEY UPDATE to either create or update the row
    await db.query(
      `INSERT INTO OwnerSettings (OwnerID, Preferences) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE Preferences = ?`,
      [ownerId, JSON.stringify(preferences), JSON.stringify(preferences)]
    );

    res.status(200).json({ message: "Settings saved successfully" });
  } catch (error) {
    console.error("SAVE SETTINGS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};