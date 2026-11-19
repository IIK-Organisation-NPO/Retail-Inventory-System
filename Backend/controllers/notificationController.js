const db = require('../config/db');

// --- GET ALL NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const [notifications] = await db.query(
      'SELECT * FROM Notifications WHERE OwnerID = ? ORDER BY CreatedAt DESC',
      [ownerId]
    );
    res.status(200).json(notifications);
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- MARK ALL AS READ ---
exports.markAllAsRead = async (req, res) => {
  const ownerId = req.user.id;

  try {
    await db.query(
      'UPDATE Notifications SET IsRead = TRUE WHERE OwnerID = ? AND IsRead = FALSE',
      [ownerId]
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};