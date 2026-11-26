const db = require('../config/db');

// Targets shown on the dashboard cards.
const TARGET_STORES = 100;
const TARGET_ACTIVE_USERS = 250;
const TARGET_TRANSACTIONS_PER_DAY = 10000;

// SyncStatus values in synclog that count as a successful sync (lowercase).
// Change these if your synclog uses different words.
const SYNC_SUCCESS_VALUES = ['synced', 'success', 'completed'];

// range option -> how many days back it covers (today = 1 day).
const RANGES = { today: 1, '7': 7, '30': 30 };

const ACTION_LABELS = {
  STORE_APPROVED:  'Store approved',
  STORE_REJECTED:  'Store rejected',
  STORE_SUSPENDED: 'Store suspended',
  USER_DISABLED:   'User disabled',
  USER_ENABLED:    'User enabled',
  USER_LOGIN:      'Login',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Same actor-name join the audit log page uses.
const ACTIVITY_FROM_SQL = `
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

// Same readable details as the audit log page.
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

// "2026-11-26" -> a Date at midnight UTC, so adding or removing days never
// shifts because of the server's time zone.
const dateFromKey = (key) => new Date(`${key}T00:00:00Z`);
const daysBefore = (key, days) => {
  const d = dateFromKey(key);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
};

// ---------- chart builders ----------

// Today: six 4-hour blocks.
const buildTodayChart = async () => {
  const [rows] = await db.query(
    `SELECT FLOOR(HOUR(SaleDateTime) / 4) AS block, COUNT(*) AS total
       FROM sales
      WHERE SaleDateTime >= CURDATE()
        AND SaleDateTime <  DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      GROUP BY block`
  );
  const counts = new Array(6).fill(0);
  rows.forEach((r) => {
    const i = Number(r.block);
    if (i >= 0 && i < 6) counts[i] = Number(r.total);
  });
  const pad = (n) => String(n).padStart(2, '0');
  return counts.map((value, i) => ({ label: `${pad(i * 4)}–${pad(i * 4 + 4)}`, value }));
};

// Last 7 days (one bar per day) or last 30 days (six bars of 5 days each).
// Oldest on the left, the latest on the right.
const buildDaysChart = async (days) => {
  const [[todayRow]] = await db.query(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today`);
  const today = todayRow.today;

  const [rows] = await db.query(
    `SELECT DATEDIFF(CURDATE(), DATE(SaleDateTime)) AS daysAgo, COUNT(*) AS total
       FROM sales
      WHERE SaleDateTime >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND SaleDateTime <  DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      GROUP BY daysAgo`,
    [days - 1]
  );

  const perDay = new Array(days).fill(0); // index 0 = today
  rows.forEach((r) => {
    const i = Number(r.daysAgo);
    if (i >= 0 && i < days) perDay[i] = Number(r.total);
  });

  if (days === 7) {
    const chart = [];
    for (let i = 6; i >= 0; i--) {
      chart.push({ label: WEEKDAYS[daysBefore(today, i).getUTCDay()], value: perDay[i] });
    }
    return chart;
  }

  // 30 days -> 6 buckets of 5 days
  const chart = [];
  for (let bucket = 5; bucket >= 0; bucket--) {
    const newest = bucket * 5;      // days ago of the newest day in this bucket
    const oldest = bucket * 5 + 4;  // days ago of the oldest day in this bucket
    let value = 0;
    for (let i = newest; i <= oldest; i++) value += perDay[i];

    const from = daysBefore(today, oldest);
    const to = daysBefore(today, newest);
    const label =
      from.getUTCMonth() === to.getUTCMonth()
        ? `${from.getUTCDate()}–${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]}`
        : `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]}–${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]}`;
    chart.push({ label, value });
  }
  return chart;
};

// GET /api/admin/dashboard?range=today|7|30
exports.getAdminDashboard = async (req, res) => {
  try {
    const range = String(req.query.range || '30');
    if (!Object.prototype.hasOwnProperty.call(RANGES, range)) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: { range: 'Range must be today, 7 or 30.' },
      });
    }
    const days = RANGES[range];

    // 1. Counts for the metric cards
    const [[counts]] = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM stores WHERE Status = 'Approved') AS stores,
         (SELECT COUNT(*) FROM admin    WHERE IsActive = 1)
       + (SELECT COUNT(*) FROM owner    WHERE IsActive = 1)
       + (SELECT COUNT(*) FROM staff    WHERE IsActive = 1)
       + (SELECT COUNT(*) FROM supplier WHERE IsActive = 1) AS activeUsers,
         (SELECT COUNT(*) FROM sales
           WHERE SaleDateTime >= CURDATE()
             AND SaleDateTime <  DATE_ADD(CURDATE(), INTERVAL 1 DAY)) AS transactionsToday`
    );

    // 2. Sync success for the chosen period (null when nothing was synced)
    const [[sync]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN LOWER(SyncStatus) IN (?) THEN 1 ELSE 0 END) AS succeeded
         FROM synclog
        WHERE CreatedAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [SYNC_SUCCESS_VALUES, days - 1]
    );
    const syncTotal = Number(sync.total) || 0;
    const syncSuccess =
      syncTotal > 0
        ? Math.round((Number(sync.succeeded) / syncTotal) * 1000) / 10
        : null;

    // 3. Chart
    const chart = range === 'today' ? await buildTodayChart() : await buildDaysChart(days);

    // 4. Waiting for review (pending stores only, until suppliers have a status)
    const [[pendingCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM stores WHERE Status = 'Pending'`
    );
    const [pendingStores] = await db.query(
      `SELECT StoreID, StoreName, CreatedAt
         FROM stores
        WHERE Status = 'Pending'
        ORDER BY CreatedAt ASC
        LIMIT 5`
    );
    const waiting = pendingStores.map((s) => ({
      id: `store-${s.StoreID}`,
      applicant: s.StoreName,
      type: 'Store',
      sent: s.CreatedAt,
      to: `/admin/stores?store=${s.StoreID}`,
    }));

    // 5. Recent activity (latest 5)
    const [activityRows] = await db.query(
      `SELECT al.AuditLogID, al.Action, al.Description, al.CreatedAt,
              al.Admin_id, al.Owner_id, al.Staff_id, al.Supplier_id,
              CASE WHEN al.Admin_id    IS NOT NULL THEN 'Admin'
                   WHEN al.Owner_id    IS NOT NULL THEN 'Store Owner'
                   WHEN al.Staff_id    IS NOT NULL THEN 'Store Staff'
                   WHEN al.Supplier_id IS NOT NULL THEN 'Supplier'
                   ELSE NULL END AS actorRole,
              ${ACTOR_NAME_SQL} AS actorName
         ${ACTIVITY_FROM_SQL}
        ORDER BY al.CreatedAt DESC, al.AuditLogID DESC
        LIMIT 5`
    );
    const activity = activityRows.map((r) => {
      const actorId = r.Admin_id || r.Owner_id || r.Staff_id || r.Supplier_id;
      let user = r.actorName ? String(r.actorName).trim() : '';
      if (!user) user = r.actorRole ? `${r.actorRole} #${actorId}` : 'System';
      return {
        id: r.AuditLogID,
        time: r.CreatedAt,
        user,
        event: prettyAction(r.Action),
        details: formatDetails(r.Action, r.Description),
      };
    });

    return res.status(200).json({
      range,
      metrics: {
        storesOnboarded:   { value: Number(counts.stores) || 0,           target: TARGET_STORES },
        activeUsers:       { value: Number(counts.activeUsers) || 0,      target: TARGET_ACTIVE_USERS },
        transactionsToday: { value: Number(counts.transactionsToday) || 0, target: TARGET_TRANSACTIONS_PER_DAY },
        syncSuccess:       { value: syncSuccess, target: 95 },
        // Not in the database: these come from Azure Monitor later.
        uptime:            { value: null, target: 99 },
        pageLoad:          { value: null, target: 3 },
      },
      chart,
      waiting: {
        total: Number(pendingCount.total) || 0,
        stores: Number(pendingCount.total) || 0,
        suppliers: 0,
        items: waiting,
      },
      activity,
    });
  } catch (err) {
    console.error('ADMIN DASHBOARD ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};