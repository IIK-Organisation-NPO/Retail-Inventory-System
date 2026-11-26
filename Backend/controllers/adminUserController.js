const db = require('../config/db');

// Shown in the "Store or company" column for admin accounts.
const ADMIN_ORGANIZATION = 'IIK';

const TYPES = {
  admin:    { role: 'Admin',       table: 'admin',    idColumn: 'AdminID' },
  owner:    { role: 'Store Owner', table: 'owner',    idColumn: 'OwnerID' },
  staff:    { role: 'Store Staff', table: 'staff',    idColumn: 'StaffID' },
  supplier: { role: 'Supplier',    table: 'supplier', idColumn: 'SupplierID' },
};

const ROLE_ORDER = ['admin', 'owner', 'staff', 'supplier'];

// Last sign-in comes from auditlog rows with Action = 'USER_LOGIN'.
// Until the login controller writes those rows this is NULL for everyone.
const lastSignIn = (auditColumn, idExpression) =>
  `(SELECT MAX(al.CreatedAt) FROM auditlog al
     WHERE al.Action = 'USER_LOGIN' AND al.${auditColumn} = ${idExpression})`;

const QUERIES = {
  admin: `
    SELECT a.AdminID AS id, a.Name, a.Surname, a.Email, a.MobileNumber,
           a.IsActive, a.CreatedAt,
           NULL AS organizations,
           ${lastSignIn('Admin_id', 'a.AdminID')} AS lastSignIn
      FROM admin a`,
  owner: `
    SELECT o.OwnerID AS id, o.Name, o.Surname, o.Email, o.MobileNumber,
           o.IsActive, o.CreatedAt,
           (SELECT GROUP_CONCAT(s.StoreName ORDER BY s.StoreName SEPARATOR '||')
              FROM stores s WHERE s.OwnerID = o.OwnerID) AS organizations,
           ${lastSignIn('Owner_id', 'o.OwnerID')} AS lastSignIn
      FROM owner o`,
  staff: `
    SELECT sf.StaffID AS id, sf.Name, sf.Surname, sf.Email, sf.MobileNumber,
           sf.IsActive, sf.CreatedAt,
           (SELECT GROUP_CONCAT(st.StoreName ORDER BY st.StoreName SEPARATOR '||')
              FROM storeusers su
              JOIN stores st ON st.StoreID = su.StoreID
             WHERE su.StaffID = sf.StaffID AND su.IsActive = 1) AS organizations,
           ${lastSignIn('Staff_id', 'sf.StaffID')} AS lastSignIn
      FROM staff sf`,
  supplier: `
    SELECT sp.SupplierID AS id, sp.Name, sp.Surname, sp.Email, sp.MobileNumber,
           sp.IsActive, sp.CreatedAt,
           sp.CompanyName AS organizations,
           ${lastSignIn('Supplier_id', 'sp.SupplierID')} AS lastSignIn
      FROM supplier sp`,
};

const mapUser = (type, r) => {
  const names = r.organizations ? String(r.organizations).split('||') : [];

  let organization;
  if (type === 'admin') {
    organization = ADMIN_ORGANIZATION;
  } else if (names.length === 0) {
    organization = type === 'owner' ? 'No store yet' : type === 'staff' ? 'Not assigned' : 'Not set';
  } else if (names.length > 1) {
    organization = `${names[0]} (+${names.length - 1} more)`;
  } else {
    organization = names[0];
  }

  return {
    id:                 `${type}-${r.id}`,
    name:               `${r.Name || ''} ${r.Surname || ''}`.trim(),
    role:               TYPES[type].role,
    organization,
    organizationDetail: names.length > 1 ? names.join(', ') : organization,
    status:             Number(r.IsActive) === 1 ? 'Active' : 'Disabled',
    mobile:             r.MobileNumber || '',
    email:              r.Email || '',
    createdAt:          r.CreatedAt || null,
    lastSignIn:         r.lastSignIn || null,
  };
};

const parseUserKey = (value) => {
  const match = /^(admin|owner|staff|supplier)-(\d+)$/.exec(String(value || ''));
  if (!match) return null;
  const id = Number(match[2]);
  return id > 0 ? { type: match[1], id } : null;
};

// GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const results = await Promise.all(
      ROLE_ORDER.map((type) => db.query(QUERIES[type]))
    );

    const users = [];
    results.forEach(([rows], index) => {
      const type = ROLE_ORDER[index];
      rows.forEach((row) => users.push(mapUser(type, row)));
    });

    // Admins, owners, staff, suppliers; names A to Z inside each group.
    users.sort((a, b) => {
      const roleDiff =
        ROLE_ORDER.indexOf(a.id.split('-')[0]) - ROLE_ORDER.indexOf(b.id.split('-')[0]);
      return roleDiff !== 0 ? roleDiff : a.name.localeCompare(b.name);
    });

    return res.status(200).json({ users });
  } catch (err) {
    console.error('ADMIN LIST USERS ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};

// PUT /api/admin/users/:userId/status
// :userId looks like owner-4 or staff-7. Body: { status: 'Active' | 'Disabled' }
exports.updateUserStatus = async (req, res) => {
  let conn;
  try {
    const parsed = parseUserKey(req.params.userId);
    if (!parsed) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const status = String((req.body && req.body.status) || '').trim();
    if (status !== 'Active' && status !== 'Disabled') {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: { status: 'Status must be Active or Disabled.' },
      });
    }

    const { type, id } = parsed;
    const { table, idColumn, role } = TYPES[type];

    const [[target]] = await db.query(
      `SELECT ${idColumn} AS id, Name, Surname, IsActive FROM ${table} WHERE ${idColumn} = ?`,
      [id]
    );
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentStatus = Number(target.IsActive) === 1 ? 'Active' : 'Disabled';
    if (currentStatus === status) {
      const msg = `This user is already ${status.toLowerCase()}.`;
      return res.status(409).json({ message: msg, errors: { status: msg } });
    }

    if (status === 'Disabled' && type === 'admin') {
      if (String(req.user.role).toUpperCase() === 'ADMIN' && Number(req.user.id) === id) {
        const msg = 'You cannot disable your own account.';
        return res.status(409).json({ message: msg, errors: { status: msg } });
      }
      const [[activeAdmins]] = await db.query(
        'SELECT COUNT(*) AS total FROM admin WHERE IsActive = 1'
      );
      if (Number(activeAdmins.total) <= 1) {
        const msg = 'The last active admin cannot be disabled.';
        return res.status(409).json({ message: msg, errors: { status: msg } });
      }
    }

    const name = `${target.Name || ''} ${target.Surname || ''}`.trim();
    const action = status === 'Disabled' ? 'USER_DISABLED' : 'USER_ENABLED';
    const description = `User ${type}-${id} (${name}) | ${role} | ${status}`;

    conn = await db.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `UPDATE ${table} SET IsActive = ? WHERE ${idColumn} = ?`,
      [status === 'Active' ? 1 : 0, id]
    );

    await conn.query(
      'INSERT INTO auditlog (Admin_id, Action, Description) VALUES (?, ?, ?)',
      [req.user.id, action, description]
    );

    await conn.commit();

    return res.status(200).json({
      message: `User ${status === 'Active' ? 'enabled' : 'disabled'} successfully.`,
      user: { id: `${type}-${id}`, name, status },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error('ADMIN UPDATE USER STATUS ROLLBACK ERROR:', rollbackErr);
      }
    }
    console.error('ADMIN UPDATE USER STATUS ERROR:', err);
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