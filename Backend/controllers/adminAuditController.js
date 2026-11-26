const db = require('../config/db');

const ACTION_LABELS = {
  STORE_APPROVED:  'Store approved',
  STORE_REJECTED:  'Store rejected',
  STORE_SUSPENDED: 'Store suspended',
  USER_DISABLED:   'User disabled',
  USER_ENABLED:    'User enabled',
  USER_LOGIN:      'Login',
};

// Days for each range option (null = all time).
const RANGES = { '7': 7, '30': 30, '90': 90, all: null };

const EXPORT_LIMIT = 5000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const USER_SOURCES = [
  { type: 'admin',    table: 'admin',    idColumn: 'AdminID',    auditColumn: 'Admin_id' },
  { type: 'owner',    table: 'owner',    idColumn: 'OwnerID',    auditColumn: 'Owner_id' },
  { type: 'staff',    table: 'staff',    idColumn: 'StaffID',    auditColumn: 'Staff_id' },
  { type: 'supplier', table: 'supplier', idColumn: 'SupplierID', auditColumn: 'Supplier_id' },
];

const FROM_SQL = `
  FROM auditlog al
  LEFT JOIN admin    a  ON a.AdminID     = al.Admin_id
  LEFT JOIN owner    o  ON o.OwnerID     = al.Owner_id
  LEFT JOIN staff    sf ON sf.StaffID    = al.Staff_id
  LEFT JOIN supplier sp ON sp.SupplierID = al.Supplier_id`;

const ACTOR_NAME_SQL = `COALESCE(
    CONCAT(a.Name, ' ', a.Surname),
    CONCAT(o.Name, ' ', o.Surname),
    CONCAT(sf.Name, ' ', sf.Surname),
    CONCAT(sp.Name, ' ', sp.Surname))`;

const prettyAction = (code) =>
  ACTION_LABELS[code] ||
  String(code || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

// Turns the stored description into something readable.
//   Store rows: "Store #4 (Name) | Approved | reason"
//   User rows:  "User owner-4 (Name) | Store Owner | Disabled"
const formatDetails = (action, description) => {
  const text = String(description || '').trim();
  if (!text) return '';
  const parts = text.split(' | ');

  if (String(action).startsWith('STORE_')) {
    const match = /^Store #(\d+) \((.*)\)$/.exec(parts[0]);
    const store = match ? `${match[2]} (store #${match[1]})` : parts[0];
    const reason = parts.slice(2).join(' | ').trim();
    return reason ? `${store}. Reason: ${reason}` : store;
  }

  if (action === 'USER_DISABLED' || action === 'USER_ENABLED') {
    const match = /^User \w+-\d+ \((.*)\)$/.exec(parts[0]);
    if (match) {
      const verb = action === 'USER_DISABLED' ? 'Disabled' : 'Enabled';
      const role = parts[1] ? ` (${parts[1]})` : '';
      return `${verb} ${match[1]}${role}`;
    }
  }

  return text;
};

const parseUserKey = (value) => {
  const match = /^(admin|owner|staff|supplier)-(\d+)$/.exec(String(value || ''));
  if (!match) return null;
  const id = Number(match[2]);
  return id > 0 ? { type: match[1], id } : null;
};

const buildWhere = ({ search, action, userKey, days }) => {
  const where = [];
  const params = [];

  if (days !== null) {
    where.push('al.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
    params.push(days - 1);
  }

  if (action) {
    where.push('al.Action = ?');
    params.push(action);
  }

  if (userKey) {
    const source = USER_SOURCES.find((s) => s.type === userKey.type);
    where.push(`al.${source.auditColumn} = ?`);
    params.push(userKey.id);
  }

  if (search) {
    const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const lower = search.toLowerCase();
    const matchingCodes = Object.keys(ACTION_LABELS).filter((code) =>
      ACTION_LABELS[code].toLowerCase().includes(lower)
    );

    let clause = `(al.Description LIKE ? OR al.Action LIKE ? OR ${ACTOR_NAME_SQL} LIKE ?`;
    params.push(like, like, like);
    if (matchingCodes.length > 0) {
      clause += ' OR al.Action IN (?)';
      params.push(matchingCodes);
    }
    clause += ')';
    where.push(clause);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
};

// Options for the Action and User dropdowns: only things that exist in the log.
const loadFilterOptions = async () => {
  const [actionRows] = await db.query(
    'SELECT DISTINCT Action FROM auditlog WHERE Action IS NOT NULL'
  );
  const actions = actionRows
    .map((r) => ({ value: r.Action, label: prettyAction(r.Action) }))
    .sort((x, y) => x.label.localeCompare(y.label));

  const userResults = await Promise.all(
    USER_SOURCES.map((s) =>
      db.query(
        `SELECT x.${s.idColumn} AS id, CONCAT(x.Name, ' ', x.Surname) AS name
           FROM ${s.table} x
          WHERE x.${s.idColumn} IN (
                SELECT DISTINCT ${s.auditColumn} FROM auditlog
                 WHERE ${s.auditColumn} IS NOT NULL)`
      )
    )
  );

  const users = [];
  userResults.forEach(([rows], index) => {
    rows.forEach((r) =>
      users.push({ value: `${USER_SOURCES[index].type}-${r.id}`, label: r.name })
    );
  });
  users.sort((x, y) => x.label.localeCompare(y.label));

  return { actions, users };
};

// GET /api/admin/audit-log
//   ?search=&action=STORE_APPROVED&user=owner-4&range=7|30|90|all&page=1&limit=20
//   &export=true returns up to 5000 matching rows with no paging.
exports.listAuditLog = async (req, res) => {
  try {
    const errors = {};

    const range = String(req.query.range || '7');
    if (!Object.prototype.hasOwnProperty.call(RANGES, range)) {
      errors.range = 'Date range must be 7, 30, 90 or all.';
    }

    const action = req.query.action ? String(req.query.action).trim() : '';
    if (action && !/^[A-Z0-9_]{1,100}$/.test(action)) {
      errors.action = 'Invalid action.';
    }

    let userKey = null;
    if (req.query.user) {
      userKey = parseUserKey(req.query.user);
      if (!userKey) errors.user = 'Invalid user.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const search = String(req.query.search || '').trim().slice(0, 100);
    const isExport = String(req.query.export) === 'true';

    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = isExport
      ? EXPORT_LIMIT
      : Math.min(Math.max(requestedLimit || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const page = isExport ? 1 : Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const { whereSql, params } = buildWhere({
      search,
      action,
      userKey,
      days: RANGES[range],
    });

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total ${FROM_SQL} ${whereSql}`,
      params
    );
    const [[allRow]] = await db.query('SELECT COUNT(*) AS total FROM auditlog');

    const [rows] = await db.query(
      `SELECT al.AuditLogID, al.Action, al.Description, al.CreatedAt,
              al.Admin_id, al.Owner_id, al.Staff_id, al.Supplier_id,
              CASE WHEN al.Admin_id    IS NOT NULL THEN 'Admin'
                   WHEN al.Owner_id    IS NOT NULL THEN 'Store Owner'
                   WHEN al.Staff_id    IS NOT NULL THEN 'Store Staff'
                   WHEN al.Supplier_id IS NOT NULL THEN 'Supplier'
                   ELSE NULL END AS actorRole,
              ${ACTOR_NAME_SQL} AS actorName
         ${FROM_SQL}
         ${whereSql}
        ORDER BY al.CreatedAt DESC, al.AuditLogID DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const events = rows.map((r) => {
      const actorId = r.Admin_id || r.Owner_id || r.Staff_id || r.Supplier_id;
      let user = r.actorName ? String(r.actorName).trim() : '';
      if (!user) user = r.actorRole ? `${r.actorRole} #${actorId}` : 'System';

      return {
        id:         r.AuditLogID,
        time:       r.CreatedAt,
        user,
        role:       r.actorRole || null,
        action:     prettyAction(r.Action),
        actionCode: r.Action,
        details:    formatDetails(r.Action, r.Description),
      };
    });

    const total = Number(countRow.total) || 0;

    return res.status(200).json({
      events,
      total,
      totalEntries: Number(allRow.total) || 0,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      filters: await loadFilterOptions(),
    });
  } catch (err) {
    console.error('ADMIN AUDIT LOG ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};