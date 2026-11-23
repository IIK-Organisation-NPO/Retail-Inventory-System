const db = require('../config/db');

// --- GET NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
  const { storeId } = req.query;
  const userRole = req.user.role; 
  const userId = req.user.id;

  try {
    let query = 'SELECT * FROM Notifications WHERE 1=1';
    const params = [];

    // If staff, show all store alerts (e.g., "Low stock"). If owner, show their alerts.
    if (userRole === 'STAFF') {
      if (!storeId) return res.status(400).json({ message: "Store ID is required for staff" });
      query += ' AND StoreID = ?';
      params.push(storeId);
    } else {
      query += ' AND OwnerID = ?';
      params.push(userId);
    }

    query += ' ORDER BY CreatedAt DESC';

    const [notifications] = await db.query(query, params);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- MARK ONE AS READ ---
exports.markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await db.query('UPDATE Notifications SET IsRead = TRUE WHERE NotificationID = ?', [notificationId]);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("MARK ONE READ ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- MARK ALL AS READ ---
exports.markAllAsRead = async (req, res) => {
  const { storeId } = req.query;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    if (userRole === 'STAFF') {
      if (!storeId) return res.status(400).json({ message: "Store ID is required for staff" });
      await db.query(
        'UPDATE Notifications SET IsRead = TRUE WHERE StoreID = ? AND IsRead = FALSE', 
        [storeId]
      );
    } else {
      await db.query(
        'UPDATE Notifications SET IsRead = TRUE WHERE OwnerID = ? AND IsRead = FALSE', 
        [userId]
      );
    }
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("MARK ALL READ ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};