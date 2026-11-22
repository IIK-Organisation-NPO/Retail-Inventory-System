const db = require('../config/db'); // use the same db import your storeController uses

module.exports = async (req, res, next) => {
  try {
    // 1. The storeId in the URL must be a positive whole number
    const storeId = Number(req.params.storeId);
    if (!Number.isInteger(storeId) || storeId <= 0) {
      return res.status(400).json({ message: 'Invalid store ID' });
    }

    // 2. Look for this store AND this owner together
    const [rows] = await db.query(
      'SELECT StoreID, StoreName, Status FROM STORES WHERE StoreID = ? AND OwnerID = ?',
      [storeId, req.user.id] // the owner comes from the token, never from the request body
    );

    // 3. Not found, or it belongs to someone else: same answer in both cases
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // 4. Only approved stores may use dashboard features
    if (rows[0].Status !== 'Approved') {
      return res.status(403).json({ message: `Store is ${rows[0].Status.toLowerCase()}, not approved yet` });
    }

    // 5. Make the store available to the next step
    req.store = rows[0];
    next();
  } catch (err) {
    console.error('checkStoreOwnership error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};