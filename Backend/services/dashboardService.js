// ---------- Helpers (real logic, will still be used with the database) ----------

const SA_OFFSET_MS = 2 * 60 * 60 * 1000; // South Africa is UTC+2 all year
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Shifted so the UTC getters return South African time
function nowSA() {
  return new Date(Date.now() + SA_OFFSET_MS);
}

const round2 = (n) => Math.round(n * 100) / 100;

// Always returns exactly 7 entries (oldest first), with 0 for days that had no sales
function buildLast7Days(rows) {
  const totals = {};
  rows.forEach((r) => { totals[r.date] = (totals[r.date] || 0) + Number(r.amount); });

  const today = nowSA();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    result.push({ day: DAY_NAMES[d.getUTCDay()], date: key, amount: round2(totals[key] || 0) });
  }
  return result;
}

function lowStockStatus(inStock) {
  return inStock === 0 ? 'Out of stock' : 'Low';
}

// ---------- MOCK DATA (replace with database queries later) ----------

function mockSalesRows() {
  const amountsByDaysAgo = [1842.5, 2640, 2210, 1980, 1250, 1690, 1420]; // index 0 = today
  const today = nowSA();
  return amountsByDaysAgo.map((amount, daysAgo) => ({
    date: new Date(today.getTime() - daysAgo * DAY_MS).toISOString().slice(0, 10),
    amount,
  }));
}

const MOCK_PRODUCTS = [
  { product: 'Rama Margarine 500g', inStock: 0, reorder: 6 },
  { product: 'Clover Fresh Milk 1L', inStock: 9, reorder: 15 },
  { product: 'Sasko Premium Bread', inStock: 12, reorder: 15 },
  { product: 'Coca-Cola 500ml', inStock: 89, reorder: 20 },
];

const MOCK_TOP_SELLING = [
  { product: 'Coca-Cola 500ml', sold: 48 },
  { product: 'Simba Chips Original', sold: 35 },
  { product: 'White Star Maize Meal 2.5kg', sold: 21 },
];

const MOCK_STAFF = [
  { id: 1, name: 'Sipho', surname: 'Dlamini', role: 'Cashier', status: 'Active' },
  { id: 2, name: 'Nomsa', surname: 'Zulu', role: 'Stock clerk', status: 'Active' },
  { id: 3, name: 'Thabo', surname: 'Mkhize', role: 'Cashier', status: 'Disabled' },
];

const MOCK_PROCUREMENT = [
  { product: 'Rice', myRequest: '50 kg', combinedDemand: '100 kg (3 stores)', status: '2 quotes' },
  { product: 'Sunflower oil', myRequest: '20 L', combinedDemand: '60 L (4 stores)', status: 'Pending' },
];

// ---------- Main function ----------

exports.getDashboard = async (store) => {
  const salesLast7Days = buildLast7Days(mockSalesRows());
  const salesToday = salesLast7Days[6].amount; // last entry is today
  const transactionsToday = 37; // mock

  const lowStock = MOCK_PRODUCTS
    .filter((p) => p.inStock <= p.reorder)
    .map((p) => ({ ...p, status: lowStockStatus(p.inStock) }));

  return {
    isMock: true, // lets the frontend and the docs know this is sample data
    store: { id: store.StoreID, name: store.StoreName }, // real, from the STORES table
    date: nowSA().toISOString().slice(0, 10),
    stats: {
      salesToday,
      transactionsToday,
      avgSale: transactionsToday > 0 ? round2(salesToday / transactionsToday) : 0,
      inventoryValue: 74517,
      productCount: 52,
      lowStockCount: lowStock.length,
      openRequests: MOCK_PROCUREMENT.length,
    },
    salesLast7Days,
    topSelling: MOCK_TOP_SELLING,
    lowStock,
    staff: MOCK_STAFF,
    procurement: MOCK_PROCUREMENT,
  };
};

exports.buildLast7Days = buildLast7Days;