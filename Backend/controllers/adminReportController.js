const db = require('../config/db');

// Fixed targets shown in the "Platform summary" table.
const TARGETS = {
  stores: '100',
  activeUsers: '250+',
  transactionsPerDay: '10,000+',
  retention: '80%',
};

const formatNumber = (value, decimals = 2) =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const formatRand = (value, decimals = 2) => `R${formatNumber(value, decimals)}`;

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Today and the 6 days before it, oldest first.
const lastSevenDays = () => {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: dateKey(d),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  return days;
};

const SINCE_7_DAYS = "SaleDateTime >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)";
const SINCE_MONTH_START = "SaleDateTime >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";

const buildPlatformReport = async () => {
  // 1. Totals for the last 7 days
  const [[totals]] = await db.query(
    `SELECT COUNT(*) AS transactions,
            COALESCE(SUM(TotalAmount), 0) AS total,
            COALESCE(AVG(TotalAmount), 0) AS average
       FROM sales
      WHERE ${SINCE_7_DAYS}`
  );

  // 2. Sales per day (days with no sales are filled with 0 below)
  const [dailyRows] = await db.query(
    `SELECT DATE_FORMAT(SaleDateTime, '%Y-%m-%d') AS d,
            COALESCE(SUM(TotalAmount), 0) AS total
       FROM sales
      WHERE ${SINCE_7_DAYS}
      GROUP BY DATE_FORMAT(SaleDateTime, '%Y-%m-%d')`
  );

  // 3. Approved stores (also covers stores that sold but are no longer approved)
  const [storeRows] = await db.query(
    `SELECT s.StoreID, s.StoreName,
            COALESCE(SUM(sa.TotalAmount), 0) AS total,
            (SELECT COUNT(*) FROM sales x WHERE x.Store_id = s.StoreID) AS everCount
       FROM stores s
       LEFT JOIN sales sa
              ON sa.Store_id = s.StoreID
             AND sa.SaleDateTime >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      WHERE s.Status = 'Approved' OR sa.Sale_id IS NOT NULL
      GROUP BY s.StoreID, s.StoreName
      ORDER BY total DESC, s.StoreName ASC`
  );

  const [[approved]] = await db.query(
    "SELECT COUNT(*) AS total FROM stores WHERE Status = 'Approved'"
  );

  // 4. Users (staff + owners) who recorded a sale this month
  const [[users]] = await db.query(
    `SELECT COUNT(*) AS total FROM (
        SELECT CONCAT('S', Staff_id) AS uid FROM sales WHERE ${SINCE_MONTH_START}
        UNION
        SELECT CONCAT('O', Owner_id) AS uid FROM sales WHERE ${SINCE_MONTH_START}
     ) AS active_users`
  );

  // ----- Shape the data exactly like REPORT_DATA.Platform on the page -----
  const total7 = Number(totals.total) || 0;
  const transactions = Number(totals.transactions) || 0;
  const activeStores = Number(approved.total) || 0;

  const byDay = {};
  dailyRows.forEach((r) => {
    byDay[r.d] = Number(r.total) || 0;
  });

  const chart = lastSevenDays().map(({ key, day }) => {
    const value = byDay[key] || 0;
    return { day, value, label: formatRand(value, 0) };
  });

  const chartMax = Math.max(...chart.map((c) => c.value));
  const highlightIndex = chartMax > 0 ? chart.findIndex((c) => c.value === chartMax) : chart.length - 1;

  const storeMax = Math.max(0, ...storeRows.map((s) => Number(s.total) || 0));
  const breakdown = storeRows.map((s) => {
    const value = Number(s.total) || 0;
    let text;
    if (value > 0) text = formatRand(value);
    else if (Number(s.everCount) > 0) text = 'No sales this week';
    else text = 'Not live yet';
    return {
      name: s.StoreName,
      value: text,
      progress: storeMax > 0 ? Math.round((value / storeMax) * 100) : 0,
    };
  });

  const sellers = storeRows.filter((s) => Number(s.total) > 0);
  let breakdownNote;
  if (sellers.length === 0) {
    breakdownNote = 'No sales recorded in the last 7 days.';
  } else if (sellers.length === 1) {
    breakdownNote = `All sales came from ${sellers[0].StoreName}.`;
  } else {
    breakdownNote =
      `${sellers.map((s) => formatNumber(s.total)).join(' + ')} = ${formatNumber(total7)}`;
  }

  return {
    type: 'Platform',
    generatedAt: new Date().toISOString(),
    metrics: [
      { label: 'Sales, last 7 days', value: formatRand(total7) },
      { label: 'Transactions', value: String(transactions) },
      { label: 'Average sale', value: formatRand(totals.average) },
      { label: 'Active stores', value: String(activeStores) },
    ],
    chartTitle: 'Sales per day, all stores (R)',
    chart,
    highlightIndex,
    breakdownTitle: 'Sales by store, last 7 days',
    breakdown,
    breakdownNote,
    summaryTitle: 'Platform summary',
    summary: [
      { measure: 'Stores onboarded', now: String(activeStores), target: TARGETS.stores },
      { measure: 'Active users this month', now: String(Number(users.total) || 0), target: TARGETS.activeUsers },
      { measure: 'Transactions a day', now: String(Math.round(transactions / 7)), target: TARGETS.transactionsPerDay },
      { measure: 'User retention', now: 'Measured after the first month', target: TARGETS.retention },
    ],
  };
};

// GET /api/admin/reports?type=Platform
exports.getReport = async (req, res) => {
  try {
    const type = String(req.query.type || 'Platform').trim();

    if (type === 'Procurement') {
      return res.status(501).json({ message: 'The Procurement report is not available yet.' });
    }
    if (type !== 'Platform') {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: { type: 'Report type must be Platform.' },
      });
    }

    const report = await buildPlatformReport();
    return res.status(200).json(report);
  } catch (err) {
    console.error('ADMIN REPORT ERROR:', err);
    return res.status(500).json({
      message: 'Server error.',
      debug: err && err.message,
      debugCode: err && err.code,
      debugSql: err && err.sql,
    });
  }
};