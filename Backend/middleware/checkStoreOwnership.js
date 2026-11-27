const db = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    // Debugging: See exactly what the token contains in your backend terminal
    console.log("--- checkStoreOwnership ---");
    console.log("User from token:", req.user); 

    const rawStoreId = req.params.storeId || req.query.storeId || req.body.storeId;
    const storeId = Number(rawStoreId);

    if (!storeId || !Number.isInteger(storeId) || storeId <= 0) {
      return res.status(400).json({ message: 'Invalid or missing store ID' });
    }

    const [storeRows] = await db.query(
      'SELECT StoreID, StoreName, Status, OwnerID FROM STORES WHERE StoreID = ?',
      [storeId]
    );

    if (storeRows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const store = storeRows[0];

    if (store.Status !== 'Approved') {
      return res.status(403).json({ message: `Store is ${store.Status.toLowerCase()}, not approved yet` });
    }

    // Normalize role to uppercase to prevent case-sensitivity issues (e.g., 'staff' vs 'STAFF')
    const userRole = (req.user.role || '').toUpperCase();

    if (userRole === 'ADMIN') {
      req.store = store;
      return next();
    }

    if (userRole === 'OWNER') {
      if (store.OwnerID !== req.user.id) {
        return res.status(403).json({ message: 'Access Denied. You do not own this store.' });
      }
      req.store = store;
      return next();
    }

    if (userRole === 'STAFF') {
      console.log(`User is STAFF. Checking StoreUsers for StaffID: ${req.user.id}, StoreID: ${storeId}`);
      
      const [staffRows] = await db.query(
        'SELECT * FROM StoreUsers WHERE StoreID = ? AND StaffID = ?',
        [storeId, req.user.id]
      );

      if (staffRows.length === 0) {
        return res.status(403).json({ message: 'Access Denied. You are not assigned to this store.' });
      }

      const staffRecord = staffRows[0];
      if (staffRecord.IsActive === 0 || staffRecord.Status === 'Disabled') {
        return res.status(403).json({ message: 'Access Denied. Your staff account is disabled.' });
      }

      req.store = store;
      return next();
    }

    return res.status(403).json({ message: `Access Denied. Unauthorized role: ${userRole}` });

  } catch (err) {
    console.error('checkStoreOwnership error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};