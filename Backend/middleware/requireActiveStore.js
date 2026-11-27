const db = require('../config/db');

// Reads the store id from the route (/:storeId), the query (?storeId=) or the body.
const getStoreId = (req) => {
  const raw =
    (req.params && req.params.storeId) ||
    (req.query && req.query.storeId) ||
    (req.body && req.body.storeId);
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const MESSAGES = {
  Pending:
    'This store is waiting for admin approval. You can use it as soon as it is approved.',
  Rejected: 'This store application was rejected.',
  Suspended: 'This store has been suspended.',
};

// Blocks a request when the selected store is not Approved, with a clear
// message the store switcher can show. It only blocks for the store's own
// owner, or staff assigned to the store; anything else is passed on so the
// controller's own checks (404 / 403) still apply.
//
// Attach it per route, AFTER verifyToken and authorizeRole, for example:
//   router.get('/dashboard', requireActiveStore, controller.getOwnerDashboard);
// (Use it per route, not router.use, when the store id is in the path.)
const requireActiveStore = async (req, res, next) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId || !req.user) return next();

    const [[store]] = await db.query(
      'SELECT StoreID, OwnerID, StoreName, Status FROM stores WHERE StoreID = ?',
      [storeId]
    );
    if (!store) return next();

    const role = String(req.user.role || '').trim().toUpperCase();
    const userId = req.user.id;

    if (role === 'OWNER') {
      if (Number(store.OwnerID) !== Number(userId)) return next();
    } else if (role === 'STAFF') {
      const [rows] = await db.query(
        `SELECT 1 FROM storeusers
          WHERE StoreID = ? AND StaffID = ? AND IsActive = 1 AND Status = 'Active'
          LIMIT 1`,
        [storeId, userId]
      );
      if (rows.length === 0) return next();
    } else {
      return next();
    }

    if (store.Status === 'Approved') return next();

    // For rejected or suspended stores, include the admin's reason (kept in auditlog).
    let reason = null;
    if (store.Status === 'Rejected' || store.Status === 'Suspended') {
      try {
        const [rows] = await db.query(
          `SELECT Description FROM auditlog
            WHERE Action = ? AND Description LIKE ?
            ORDER BY CreatedAt DESC, AuditLogID DESC
            LIMIT 1`,
          [
            store.Status === 'Rejected' ? 'STORE_REJECTED' : 'STORE_SUSPENDED',
            `Store #${store.StoreID} (%`,
          ]
        );
        if (rows[0]) {
          // Format: "Store #4 (Name) | Suspended | reason"
          const parts = String(rows[0].Description || '').split(' | ');
          if (parts.length >= 3) reason = parts.slice(2).join(' | ') || null;
        }
      } catch (reasonErr) {
        console.error('REQUIRE ACTIVE STORE REASON ERROR:', reasonErr);
      }
    }

    return res.status(403).json({
      message: MESSAGES[store.Status] || 'This store is not active.',
      code: 'STORE_NOT_ACTIVE',
      storeId: store.StoreID,
      storeName: store.StoreName,
      storeStatus: store.Status,
      reason,
    });
  } catch (err) {
    console.error('REQUIRE ACTIVE STORE ERROR:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = requireActiveStore;