// src/pages/Staff/Staff_SalesHistory.jsx
import { useCallback, useMemo, useState, useEffect } from "react";
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

// Use today's actual date for filtering
const TODAY = new Date().toISOString().split("T")[0];

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) => {
  if (!name) return "ST";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
};

// Today's sales show only the time; older sales also show the date
const timeText = (t) => (t.date === TODAY ? t.time : `${formatDayMonth(t.date)}, ${t.time}`);

const Staff_SalesHistory = () => {
  // UI State
  const [period, setPeriod] = useState(() => ({ type: "7", ...getPresetRange("7", TODAY) }));
  const [productFilter, setProductFilter] = useState("all");
  const [showPeriodPopup, setShowPeriodPopup] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [storeName, setStoreName] = useState("My Store");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Staff Member";

  const closePeriodPopup = useCallback(() => setShowPeriodPopup(false), []);

  // --- 1. FETCH REAL DATA FROM BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch Sales History (Backend automatically filters by StaffID)
        const salesRes = await fetch(`http://localhost:5000/api/sales/history?storeId=${storeId}`, { headers });
        const salesData = await salesRes.json();
        if (salesRes.ok) {
          setTransactions(salesData);
        }

        // Fetch Products (For the dropdown filter)
        const prodRes = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, { headers });
        const prodData = await prodRes.json();
        if (prodRes.ok) {
          setProducts(prodData.map(p => p.Name));
        }

        // Fetch Store Name
        const storeRes = await fetch(`http://localhost:5000/api/stores/my-stores`, { headers });
        const storeData = await storeRes.json();
        if (storeRes.ok && storeData.length > 0) {
          const currentStore = storeData.find(s => s.StoreID === Number(storeId));
          if (currentStore) setStoreName(currentStore.StoreName);
        }

      } catch (err) {
        setError("Failed to load sales history.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [storeId, token]);

  // --- 2. FILTERING LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Date filter
      const inDateRange = t.date >= period.from && t.date <= period.to;
      
      // Product filter (using the concatenated string from the DB)
      const hasProduct = productFilter === "all" || (t.itemsText && t.itemsText.includes(productFilter));
      
      return inDateRange && hasProduct;
    });
  }, [transactions, period, productFilter]);

  // --- 3. CALCULATE STATS ---
  const totalSales = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const averageSale = filteredTransactions.length > 0 ? totalSales / filteredTransactions.length : 0;
  const phrase = periodPhrase(period);

  const footerText =
    productFilter === "all"
      ? `All ${filteredTransactions.length} of your sales ${phrase}`
      : `${filteredTransactions.length} of your sales ${phrase} included ${productFilter}`;

  if (loading) return <div style={{ padding: '50px' }}>Loading history...</div>;

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
        {/* Page header */}
        <header className="st-header">
          <h1 className="st-page-title">My sales history</h1>

          <div className="st-header-actions">
            <span className="st-sync">Synced just now</span>

            <div className="st-store-chip">
              <span className="st-avatar st-avatar-sm" aria-hidden="true">
                {getInitials(storeName)}
              </span>
              <span>{storeName}</span>
            </div>

            <StoreOwner_UserMenu
              name={userName}
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

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
              {products.map((name) => (
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
            <p className="sh-stat-value">{filteredTransactions.length}</p>
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
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="sh-empty" style={{ textAlign: "center", padding: "20px" }}>
                      You have no sales {phrase}.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{timeText(t)}</td>
                      <td className="sh-items">{t.itemsText}</td>
                      <td>{t.payment}</td>
                      <td>{formatRand(t.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length > 0 && <p className="sh-footer">{footerText}</p>}
        </section>
      </main>

      {/* POPUP */}
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