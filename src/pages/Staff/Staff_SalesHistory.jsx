// src/pages/Staff/Staff_SalesHistory.jsx
import { useCallback, useMemo, useState } from "react";
import "../../Style/Staff/Staff_Layout.css";
import "../../Style/Staff/Staff_SalesHistory.css";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import Staff_PeriodPopup from "../../components/Staff/Staff_PeriodPopup";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import formatRand from "../../utils/formatRand";
import {
  formatDayMonth,
  getPresetRange,
  periodButtonLabel,
  periodPhrase,
} from "../../utils/salesPeriod";

// Mock data — replace with API data once the backend is connected
const STORE = { name: "Mseleku Tuckshop" };
const LAST_SYNCED = "2 min ago";

const PRICES = {
  "Coca-Cola 500ml": 26.5,
  "Simba Chips Original": 14.63,
  "Sprite 500ml": 21.45,
  "NikNaks Cheese": 15.0,
  "Fanta Orange 500ml": 20.55,
};

const item = (name, qty) => ({ name, price: PRICES[name], qty });

// Only the sales recorded by the signed-in staff member
const MY_TRANSACTIONS = [
  { id: 1, date: "2026-11-13", time: "16:42", items: [item("Coca-Cola 500ml", 2), item("Simba Chips Original", 1)], payment: "Cash" },
  { id: 2, date: "2026-11-13", time: "14:20", items: [item("Fanta Orange 500ml", 1)], payment: "Card" },
  { id: 3, date: "2026-11-13", time: "13:55", items: [item("Sprite 500ml", 3)], payment: "Cash" },
  { id: 4, date: "2026-11-13", time: "11:40", items: [item("NikNaks Cheese", 2)], payment: "Cash" },
  { id: 5, date: "2026-11-13", time: "09:05", items: [item("Fanta Orange 500ml", 2)], payment: "Cash" },
  { id: 6, date: "2026-11-04", time: "15:10", items: [item("Coca-Cola 500ml", 1)], payment: "Cash" },
  { id: 7, date: "2026-10-30", time: "12:30", items: [item("Simba Chips Original", 2), item("NikNaks Cheese", 1)], payment: "Card" },
  { id: 8, date: "2026-10-22", time: "10:15", items: [item("Sprite 500ml", 2)], payment: "Cash" },
];

// Periods are measured back from the newest sale, so the mock data stays
// visible. Switch this to today's date once real data is connected.
const TODAY = MY_TRANSACTIONS.map((t) => t.date).sort().at(-1);

const PRODUCTS = [...new Set(MY_TRANSACTIONS.flatMap((t) => t.items.map((i) => i.name)))].sort(
  (a, b) => a.localeCompare(b)
);

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const transactionTotal = (t) =>
  Math.round(t.items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100) / 100;

// "Coca-Cola 500ml ×2, Simba Chips Original ×1"
const itemsText = (t) => t.items.map((i) => `${i.name} ×${i.qty}`).join(", ");

// Today's sales show only the time; older sales also show the date
const timeText = (t) => (t.date === TODAY ? t.time : `${formatDayMonth(t.date)}, ${t.time}`);

const Staff_SalesHistory = () => {
  const [period, setPeriod] = useState(() => ({ type: "7", ...getPresetRange("7", TODAY) }));
  const [productFilter, setProductFilter] = useState("all");
  const [showPeriodPopup, setShowPeriodPopup] = useState(false);

  const closePeriodPopup = useCallback(() => setShowPeriodPopup(false), []);

  // Sales in the chosen period (and product), newest first
  const transactions = useMemo(
    () =>
      MY_TRANSACTIONS.filter(
        (t) =>
          t.date >= period.from &&
          t.date <= period.to &&
          (productFilter === "all" || t.items.some((i) => i.name === productFilter))
      ).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)),
    [period, productFilter]
  );

  const totalSales = transactions.reduce((sum, t) => sum + transactionTotal(t), 0);
  const averageSale = transactions.length > 0 ? totalSales / transactions.length : 0;
  const phrase = periodPhrase(period);

  const footerText =
    productFilter === "all"
      ? `All ${transactions.length} of your sales ${phrase}`
      : `${transactions.length} of your sales ${phrase} included ${productFilter}`;

  return (
    <div className="st-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <Staff_Sidebar alertCount={3} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="st-main">
        {/* Page header: title, sync status, store, user avatar */}
        <header className="st-header">
          <h1 className="st-page-title">My sales history</h1>

          <div className="st-header-actions">
            <span className="st-sync">Synced {LAST_SYNCED}</span>

            {/* Staff work in one store, so this is a label, not a switcher */}
            <div className="st-store-chip">
              <span className="st-avatar st-avatar-sm" aria-hidden="true">
                {getInitials(STORE.name)}
              </span>
              <span>{STORE.name}</span>
            </div>

            <StoreOwner_UserMenu
              name="Lindiwe Ngcobo"
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {/* Filters */}
        <div className="sh-filters">
          <div className="sh-filter-group">
            <select
              className="sh-select"
              aria-label="Filter by product"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="all">All products</option>
              {PRODUCTS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <button
              type="button"
              className="sh-period-btn"
              aria-haspopup="dialog"
              onClick={() => setShowPeriodPopup(true)}
            >
              {periodButtonLabel(period)}
              <svg width="8" height="5" viewBox="0 0 10 6" aria-hidden="true">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <span className="sh-info">You see only the sales you recorded</span>
        </div>

        {/* Summary cards */}
        <section className="sh-stats">
          <div className="sh-stat-card">
            <p className="sh-stat-label">{period.type === "today" ? "My sales today" : "My sales"}</p>
            <p className="sh-stat-value">{formatRand(totalSales)}</p>
          </div>
          <div className="sh-stat-card">
            <p className="sh-stat-label">My transactions</p>
            <p className="sh-stat-value">{transactions.length}</p>
          </div>
          <div className="sh-stat-card">
            <p className="sh-stat-label">Average sale</p>
            <p className="sh-stat-value">{formatRand(averageSale)}</p>
          </div>
        </section>

        {/* Transactions table */}
        <section className="sh-card">
          <h2 className="sh-card-title">My transactions</h2>

          <div className="sh-table-wrapper">
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="sh-empty">
                      You have no sales {phrase}.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{timeText(t)}</td>
                      <td className="sh-items">{itemsText(t)}</td>
                      <td>{t.payment}</td>
                      <td>{formatRand(transactionTotal(t))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {transactions.length > 0 && <p className="sh-footer">{footerText}</p>}
        </section>
      </main>

      {/* =========================================
          POPUP
          ========================================= */}
      {showPeriodPopup && (
        <Staff_PeriodPopup
          value={period}
          today={TODAY}
          onApply={setPeriod}
          onClose={closePeriodPopup}
        />
      )}
    </div>
  );
};

export default Staff_SalesHistory;
