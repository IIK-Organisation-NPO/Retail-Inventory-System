const db = require('../config/db');

const VALID_STATUSES = ['Pending', 'Approved', 'Rejected', 'Suspended'];

// Which current statuses may move to each new status.
const ALLOWED_TRANSITIONS = {
  Approved:  ['Pending', 'Suspended'],
  Rejected:  ['Pending'],
  Suspended: ['Approved'],
};

const AUDIT_ACTIONS = {
  Approved:  'STORE_APPROVED',
  Rejected:  'STORE_REJECTED',
  Suspended: 'STORE_SUSPENDED',
};

const HISTORY_TITLES = {
  STORE_APPROVED:  'Approved',
  STORE_REJECTED:  'Application rejected',
  STORE_SUSPENDED: 'Store suspended',
};

// Runs a read query; on failure logs the real error and returns the fallback
// so one missing table/column cannot take down the whole admin page.
const safeQuery = async (label, sql, params, fallback) => {
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error(`ADMIN STORES ${label} ERROR:`, err);
    return fallback;
  }
};

const parseStoreId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const STORE_SELECT = `
  SELECT s.StoreID, s.OwnerID, s.StoreName, s.RegistrationNumber,
         s.ContactNumber, s.Email, s.Province, s.Municipality, s.Address,
         s.Status, s.CreatedAt, s.UpdatedAt,
         o.Name AS OwnerName, o.Surname AS OwnerSurname,
         o.Email AS OwnerEmail, o.MobileNumber AS OwnerMobile,
         (SELECT COUNT(*) FROM storeusers su
           WHERE su.StoreID = s.StoreID AND su.IsActive = 1) AS StaffCount,
         (SELECT MAX(sa.SaleDateTime) FROM sales sa
           WHERE sa.Store_id = s.StoreID) AS LastActivity
    FROM stores s
    LEFT JOIN owner o ON o.OwnerID = s.OwnerID`;

const mapStore = (s) => ({
  storeId:            s.StoreID,
  storeName:          s.StoreName,
  registrationNumber: s.RegistrationNumber,
  contactNumber:      s.ContactNumber,
  email:              s.Email,
  province:           s.Province,
  municipality:       s.Municipality,
  address:            s.Address,
  status:             s.Status,
  createdAt:          s.CreatedAt,
  updatedAt:          s.UpdatedAt,
  staffCount:         Number(s.StaffCount) || 0,
  lastActivity:       s.LastActivity || null,
  owner: {
    id:           s.OwnerID,
    name:         `${s.OwnerName || ''} ${s.OwnerSurname || ''}`.trim(),
    email:        s.OwnerEmail || null,
    mobileNumber: s.OwnerMobile || null,
  },
});

// GET /api/admin/stores?status=Pending&search=abc
exports.listStores = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = [];
    const params = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: 'Validation failed.',
          errors: { status: 'Status must be Pending, Approved, Rejected or Suspended.' },
        });
      }
      where.push('s.Status = ?');
      params.push(status);
    }

    if (search && String(search).trim()) {
      const like = `%${String(search).trim()}%`;
      where.push(
        `(s.StoreName LIKE ? OR s.RegistrationNumber LIKE ?
          OR o.Name LIKE ? OR o.Surname LIKE ? OR o.Email LIKE ?)`
      );
      params.push(like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [stores] = await db.query(
      `${STORE_SELECT}
       ${whereSql}
       ORDER BY (s.Status = 'Pending') DESC, s.CreatedAt DESC`,
      params
    );

    const [countRows] = await db.query(
      'SELECT Status, COUNT(*) AS total FROM stores GROUP BY Status'
    );

    const counts = { Pending: 0, Approved: 0, Rejected: 0, Suspended: 0, all: 0 };
    countRows.forEach((r) => {
      if (counts[r.Status] !== undefined) counts[r.Status] = Number(r.total) || 0;
      counts.all += Number(r.total) || 0;
    });

    return res.status(200).json({
      stores: stores.map(mapStore),
      counts,
    });
  } catch (err) {
    console.error('ADMIN LIST STORES ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};

// GET /api/admin/stores/:storeId
// Store details + a read-only "functionality" summary built from real tables
// + the decision history read back from auditlog.
exports.getStore = async (req, res) => {
  try {
    const storeId = parseStoreId(req.params.storeId);
    if (!storeId) {
      return res.status(400).json({ message: 'Invalid store id.' });
    }

    const [[store]] = await db.query(
      `${STORE_SELECT} WHERE s.StoreID = ?`,
      [storeId]
    );

    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    const staffRows = await safeQuery(
      'STAFF',
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(IsActive = 1), 0) AS active
         FROM storeusers
        WHERE StoreID = ?`,
      [storeId],
      [{ total: 0, active: 0 }]
    );

    const inventoryRows = await safeQuery(
      'INVENTORY',
      `SELECT COUNT(*) AS productCount,
              COALESCE(SUM(Quantity <= ReorderLevel), 0) AS lowStockCount,
              MAX(UpdatedAt) AS lastInventoryUpdate
         FROM inventory
        WHERE StoreID = ?`,
      [storeId],
      [{ productCount: 0, lowStockCount: 0, lastInventoryUpdate: null }]
    );

    const salesRows = await safeQuery(
      'SALES',
      `SELECT COUNT(*) AS salesCount,
              COALESCE(SUM(TotalAmount), 0) AS salesValue,
              MAX(SaleDateTime) AS lastSaleAt
         FROM sales
        WHERE Store_id = ?
          AND SaleDateTime >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [storeId],
      [{ salesCount: 0, salesValue: 0, lastSaleAt: null }]
    );

    const allTimeSalesRows = await safeQuery(
      'SALES ALL TIME',
      'SELECT COUNT(*) AS total FROM sales WHERE Store_id = ?',
      [storeId],
      [{ total: 0 }]
    );

    // The stores table has no rejection/suspension reason column, so the
    // decisions are read back from auditlog (written by updateStoreStatus).
    const auditRows = await safeQuery(
      'HISTORY',
      `SELECT Action, Description, CreatedAt
         FROM auditlog
        WHERE Action IN ('STORE_APPROVED', 'STORE_REJECTED', 'STORE_SUSPENDED')
          AND Description LIKE ?
        ORDER BY CreatedAt DESC, AuditLogID DESC`,
      [`Store #${storeId} (%`],
      []
    );

    const staff = staffRows[0] || { total: 0, active: 0 };
    const inv = inventoryRows[0] || {};
    const sales = salesRows[0] || {};
    const allTime = allTimeSalesRows[0] || { total: 0 };

    const staffCount = Number(staff.total) || 0;
    const productCount = Number(inv.productCount) || 0;
    const totalSalesEver = Number(allTime.total) || 0;

    const mapped = mapStore(store);

    // Description format: "Store #4 (Name) | Approved | reason"
    const history = auditRows.map((r) => {
      const parts = String(r.Description || '').split(' | ');
      const detail =
        parts.length >= 3
          ? parts.slice(2).join(' | ') || 'No note'
          : r.Description || '';
      return {
        title:  HISTORY_TITLES[r.Action] || r.Action,
        detail,
        at:     r.CreatedAt,
      };
    });
    history.push({
      title:  'Submitted',
      detail: mapped.owner.name ? `by ${mapped.owner.name}` : 'Store application submitted',
      at:     store.CreatedAt,
    });

    return res.status(200).json({
      store: mapped,
      functionality: {
        staff: {
          total:  staffCount,
          active: Number(staff.active) || 0,
        },
        inventory: {
          productCount,
          lowStockCount:       Number(inv.lowStockCount) || 0,
          lastInventoryUpdate: inv.lastInventoryUpdate || null,
        },
        sales: {
          last30DaysCount: Number(sales.salesCount) || 0,
          last30DaysValue: Number(sales.salesValue) || 0,
          totalEver:       totalSalesEver,
          lastSaleAt:      sales.lastSaleAt || null,
        },
        checklist: {
          hasStaff:    staffCount > 0,
          hasProducts: productCount > 0,
          hasSales:    totalSalesEver > 0,
        },
      },
      history,
    });
  } catch (err) {
    console.error('ADMIN GET STORE ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};

// PUT /api/admin/stores/:storeId/status
// Body: { status: 'Approved' | 'Rejected' | 'Suspended', reason?: string }
// Rejecting or suspending requires a reason (3 to 250 characters).
// Allowed moves: Pending -> Approved/Rejected, Approved -> Suspended,
// Suspended -> Approved (reactivate).
//
// Suspended needs the stores.Status ENUM to include 'Suspended':
//   ALTER TABLE stores MODIFY Status
//     ENUM('Pending','Approved','Rejected','Suspended') NOT NULL DEFAULT 'Pending';
exports.updateStoreStatus = async (req, res) => {
  let conn;
  try {
    const storeId = parseStoreId(req.params.storeId);
    if (!storeId) {
      return res.status(400).json({ message: 'Invalid store id.' });
    }

    const adminId = req.user.id;
    const status = String((req.body && req.body.status) || '').trim();
    const reason = String((req.body && req.body.reason) || '').trim();

    const errors = {};

    if (!ALLOWED_TRANSITIONS[status]) {
      errors.status = 'Choose Approved, Rejected or Suspended.';
    } else if (status === 'Rejected' || status === 'Suspended') {
      if (!reason) {
        errors.reason =
          status === 'Rejected'
            ? 'Enter a reason for rejecting this store.'
            : 'Enter a reason for suspending this store.';
      } else if (reason.length < 3) {
        errors.reason = 'The reason must be at least 3 characters.';
      }
    }
    if (reason.length > 250) {
      errors.reason = 'The reason must be 250 characters or fewer.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const [[store]] = await db.query(
      'SELECT StoreID, OwnerID, StoreName, Status FROM stores WHERE StoreID = ?',
      [storeId]
    );
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    if (store.Status === status) {
      return res.status(409).json({
        message: `This store is already ${status}.`,
        errors: { status: `This store is already ${status}.` },
      });
    }

    if (!ALLOWED_TRANSITIONS[status].includes(store.Status)) {
      const msg = `A ${store.Status} store cannot be changed to ${status}.`;
      return res.status(409).json({ message: msg, errors: { status: msg } });
    }

    const auditAction = AUDIT_ACTIONS[status];
    const auditDescription = `Store #${store.StoreID} (${store.StoreName}) | ${status} | ${reason}`;

    let notifTitle;
    let notifMessage;
    if (status === 'Approved') {
      notifTitle = 'Your store was approved';
      notifMessage =
        `${store.StoreName} has been approved. You can now start using it.` +
        `${reason ? ` Note from admin: ${reason}` : ''}`;
    } else if (status === 'Rejected') {
      notifTitle = 'Your store was rejected';
      notifMessage = `${store.StoreName} was rejected. Reason: ${reason}`;
    } else {
      notifTitle = 'Your store was suspended';
      notifMessage = `${store.StoreName} has been suspended. Reason: ${reason}`;
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    await conn.query(
      'UPDATE stores SET Status = ?, UpdatedAt = NOW() WHERE StoreID = ?',
      [status, storeId]
    );

    await conn.query(
      'INSERT INTO auditlog (Admin_id, Action, Description) VALUES (?, ?, ?)',
      [adminId, auditAction, auditDescription]
    );

    if (store.OwnerID) {
      await conn.query(
        `INSERT INTO notifications (Owner_id, Title, Message, NotificationType)
         VALUES (?, ?, ?, ?)`,
        [store.OwnerID, notifTitle, notifMessage, 'STORE_STATUS']
      );
    }

    await conn.commit();

    return res.status(200).json({
      message: `Store ${status.toLowerCase()} successfully.`,
      store: {
        storeId:   store.StoreID,
        storeName: store.StoreName,
        status,
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error('ADMIN UPDATE STORE STATUS ROLLBACK ERROR:', rollbackErr);
      }
    }
    console.error('ADMIN UPDATE STORE STATUS ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  } finally {
    if (conn) conn.release();
  }
};