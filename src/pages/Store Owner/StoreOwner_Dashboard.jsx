import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_RecordSale_popup from "../../components/Store Owner/StoreOwner_RecordSale_popup";
import StoreOwner_AddStaff_popup from "../../components/Store Owner/StoreOwner_AddStaff_popup";
import { readSavedStoreId } from "../../data/stores";
import Logo from "../../assets/images/IIK logo.png";
import "../../Style/Store Owner/StoreOwner_Dashboard.css";

const API = "http://localhost:5000/api";

// Sample products for the Record sale popup. Replace when the products API is ready.
const DASHBOARD_PRODUCTS = [
  { id: 1, product: "Coca-Cola 500ml", price: 26.5, onHand: 89, barcode: "5449000000996" },
  { id: 2, product: "Simba Chips Original", price: 14.63, onHand: 38, barcode: "6001234500028" },
  { id: 3, product: "Sprite 500ml", price: 21.45, onHand: 55, barcode: "6001234500035" },
  { id: 4, product: "NikNaks Cheese", price: 15, onHand: 66, barcode: "6001234500042" },
  { id: 5, product: "Fanta Orange 500ml", price: 20.55, onHand: 12, barcode: "6001234500059" },
  { id: 6, product: "Ace Maize Meal 2.5kg", price: 64.03, onHand: 20, barcode: "6001234500066" },
  { id: 7, product: "Lay's Salt & Vinegar", price: 18.99, onHand: 24, barcode: "6001234500073" },
];

// Sends a GET request to the backend with the login token
const apiGet = async (path, token) => {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

// 1842.5 -> "R1,842.50"
const rand = (amount) =>
  "R" + Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  // Starts as true when the user is logged in, so no effect has to set it
  const [loading, setLoading] = useState(Boolean(token));
  const [fetchError, setFetchError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [showRecordSale, setShowRecordSale] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  // Staff added in the popup. TEMPORARY: not saved to the database yet.
  const [addedStaff, setAddedStaff] = useState([]);

  // Worked out while rendering, not stored in state
  const error = token ? fetchError : "Please log in again.";

  // Step 1: load the owner's real stores, then decide which one to show
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const loadStores = async () => {
      try {
        const data = await apiGet("/stores/my-stores", token);
        if (cancelled) return;

        const list = data.map((s) => ({ id: s.StoreID, name: s.StoreName }));
        setStores(list);

        if (list.length === 0) {
          setFetchError("You have no stores yet. Register a store to see your dashboard.");
          setLoading(false);
          return;
        }
        setStoreId(readSavedStoreId(list)); // saved store, or the first one
      } catch (err) {
        if (!cancelled) {
          setFetchError(err.message);
          setLoading(false);
        }
      }
    };

    loadStores();
    return () => { cancelled = true; };
  }, [token]);

  // Step 2: once we know the store, load its dashboard
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const data = await apiGet(`/owner/dashboard?storeId=${storeId}`, token);
        if (cancelled) return;
        setDashboard(data.dashboardData);
        setFetchError("");
        setUpdatedAt(new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        if (!cancelled) setFetchError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [storeId, token]);

  // Loading and error screens (shown before we have any data)
  if (!dashboard) {
    return (
      <div className="app-layout">
        <StoreOwnerSidebar />
        <main className="main-content">
          {loading ? (
            <p>Loading your dashboard...</p>
          ) : (
            <div className="alert alert-danger">{error || "Could not load the dashboard."}</div>
          )}
        </main>
      </div>
    );
  }

  const { stats, salesData, topSelling, lowStock, procurement, alerts } = dashboard;
  const staff = [...dashboard.staff, ...addedStaff];
  const avgSale = stats.todayTransactions > 0 ? stats.todaySales / stats.todayTransactions : 0;
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const isMobileTaken = (mobile) => staff.some((member) => member.mobile === mobile);

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={alerts.lowStockCount} />

      <main className="main-content">

        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <div className="brand-logo-wrap">
              <img src={Logo} alt="IIK Organisation logo" className="brand-logo" />
            </div>
            <div className="header-title">
              <h2>Dashboard</h2>
              <p>{dashboard.storeName} • {today}</p>
            </div>
          </div>

          <div className="header-right">
            <span className="sync-status">Updated {updatedAt}</span>
            <button type="button" className="btn-primary" onClick={() => setShowRecordSale(true)}>
              Record sale
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/store-owner/inventory", { state: { openPopup: "in" } })}
            >
              Stock in
            </button>
            <button className="btn-secondary">Request stock</button>
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Alert Banners (only shown when there is something to say) */}
        <div className="alert-banners">
          {dashboard.storeStatus === "Pending" && (
            <div className="alert alert-info">This store is waiting for admin approval.</div>
          )}
          {alerts.lowStockCount > 0 && (
            <div className="alert alert-danger">
              {alerts.lowStockCount} {alerts.lowStockCount === 1 ? "product is" : "products are"} below the reorder level. Review stock
            </div>
          )}
          {alerts.newQuotesCount > 0 && (
            <div className="alert alert-info">
              {alerts.newQuotesCount} new supplier {alerts.newQuotesCount === 1 ? "quote" : "quotes"} received
            </div>
          )}
        </div>

        {/* Stat Cards Row */}
        <div className="stat-cards-grid">
          <div className="stat-card">
            <span className="stat-label">Sales today</span>
            <h3 className="stat-value">{rand(stats.todaySales)}</h3>
            <span className="stat-sub">Today so far</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Transactions today</span>
            <h3 className="stat-value">{stats.todayTransactions}</h3>
            <span className="stat-sub">Avg {rand(avgSale)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Inventory value</span>
            <h3 className="stat-value">{rand(stats.inventoryValue)}</h3>
            <span className="stat-sub">{stats.productCount} products</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low stock</span>
            <h3 className={`stat-value${stats.lowStockCount > 0 ? " text-danger" : ""}`}>{stats.lowStockCount}</h3>
            <span className="stat-sub">Below reorder level</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Open requests</span>
            <h3 className="stat-value">{stats.openRequests}</h3>
            <span className="stat-sub">Procurement network</span>
          </div>
        </div>

        {/* Middle Row: Chart & Top Selling */}
        <div className="dashboard-row">
          <div className="card chart-card">
            <div className="card-header">
              <h3>Sales, last 7 days</h3>
              <button type="button" className="btn-outline" onClick={() => navigate("/store-owner/sales")}>
                View sales report
              </button>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === salesData.length - 1 ? "#000" : "#d1d5db"} />
                    ))}
                    <LabelList
                      dataKey="amount"
                      position="top"
                      formatter={(value) => `R${Number(value).toLocaleString()}`}
                      fill="#111827"
                      fontSize={10}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card top-selling-card">
            <div className="card-header">
              <h3>Top-selling today</h3>
            </div>
            {topSelling.length === 0 ? (
              <p>No sales recorded today.</p>
            ) : (
              <ul className="top-selling-list">
                {topSelling.map((item) => (
                  <li key={item.product}>
                    <span>{item.product}</span>
                    <strong>{item.sold} sold</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Row: Low Stock & Staff */}
        <div className="dashboard-row">
          <div className="card">
            <div className="card-header">
              <h3>Low stock</h3>
              <button type="button" className="btn-outline" onClick={() => navigate("/store-owner/inventory")}>
                Open inventory
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>In stock</th>
                  <th>Reorder</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan="4">No low-stock products.</td></tr>
                ) : (
                  lowStock.map((item) => (
                    <tr key={item.product}>
                      <td>{item.product}</td>
                      <td>{item.inStock}</td>
                      <td>{item.reorder}</td>
                      <td>
                        <span className={`status-pill ${item.status === "Out of stock" ? "status-danger" : "status-warning"}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Staff</h3>
              <button type="button" className="btn-outline" onClick={() => setShowAddStaff(true)}>
                Add staff
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr><td colSpan="3">No staff added yet.</td></tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name} {member.surname}</td>
                      <td>{member.role}</td>
                      <td>
                        <span className={`status-pill ${member.status === "Active" ? "status-neutral" : "status-danger"}`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Procurement Network */}
        <div className="card">
          <div className="card-header">
            <h3>Procurement network</h3>
            <button className="btn-outline">New Request</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>My request</th>
                <th>Combined demand</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {procurement.length === 0 ? (
                <tr><td colSpan="4">No requests yet.</td></tr>
              ) : (
                procurement.map((row) => (
                  <tr key={row.product}>
                    <td>{row.product}</td>
                    <td>{row.myRequest}</td>
                    <td>{row.combinedDemand}</td>
                    <td><span className="status-pill status-neutral">{row.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>

      {showRecordSale && (
        <StoreOwner_RecordSale_popup
          products={DASHBOARD_PRODUCTS}
          onClose={() => setShowRecordSale(false)}
        />
      )}
      {showAddStaff && (
        <StoreOwner_AddStaff_popup
          stores={stores}
          defaultStoreId={storeId}
          isMobileTaken={isMobileTaken}
          onSave={(member) => setAddedStaff((current) => [
            ...current,
            { ...member, id: Date.now(), status: "Active" },
          ])}
          onClose={() => setShowAddStaff(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;