// src/pages/Staff/StaffDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_RecordSale_popup from "../../components/Store Owner/StoreOwner_RecordSale_popup";
import {
  StockAdjustmentPopup,
  StockInPopup,
  StockOutPopup,
} from "../../components/Store Owner/StoreOwner_StockIn_popup";

// Styles
import "../../Style/Staff/StaffDashboard.css";

const StaffDashboard = () => {
  const navigate = useNavigate();
  
  // State
  const [products, setProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [stats, setStats] = useState({ salesToday: 0, transactionsToday: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPopup, setOpenPopup] = useState(null);

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Staff Member";

  // --- 1. FETCH DATA ON LOAD ---
  const fetchData = async () => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // Fetch Products
      const prodRes = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, { headers });
      const prodData = await prodRes.json();
      
      let lowCount = 0;
      if (prodRes.ok) {
        const formattedProds = prodData.map(p => {
          if (p.OnHand <= p.ReorderLevel) lowCount++;
          return {
            id: p.ProductID,
            product: p.Name,
            price: Number(p.SellingPrice),
            onHand: p.OnHand,
            reorder: p.ReorderLevel,
            barcode: p.Barcode
          };
        });
        setProducts(formattedProds);
      }

      // Fetch Sales History
      const salesRes = await fetch(`http://localhost:5000/api/sales/history?storeId=${storeId}`, { headers });
      const salesData = await salesRes.json();
      
      let todaySales = 0;
      let todayTransactions = 0;
      if (salesRes.ok) {
        // Map and filter only today's sales
        const todayStr = new Date().toISOString().split('T')[0];
        
        const formattedSales = salesData.map(s => {
          if (s.date === todayStr) {
            todaySales += Number(s.total);
            todayTransactions++;
          }
          return {
            id: s.id,
            time: s.time,
            items: s.itemsText,
            payment: s.payment,
            total: `R${Number(s.total).toFixed(2)}`
          };
        });

        setRecentSales(formattedSales.slice(0, 5)); // Show only the last 5
      }

      setStats({
        salesToday: todaySales,
        transactionsToday: todayTransactions,
        lowStock: lowCount
      });

    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [storeId, token]);

  // --- 2. HANDLE RECORD SALE ---
  const handleRecordSale = async (sale) => {
    try {
      const payload = {
        storeId: storeId,
        paymentMethod: sale.payment,
        items: sale.items.map(item => ({
          productId: item.productId,
          price: item.price,
          quantity: item.qty
        }))
      };

      const response = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to save sale");

      setOpenPopup(null);
      fetchData(); // Refresh data from DB
    } catch (err) {
      alert(err.message);
    }
  };

  // --- 3. HANDLE STOCK MOVEMENTS ---
  const handleSaveMovement = async (productId, quantityChange, type, details) => {
    try {
      const payload = { storeId, productId, type, quantityChange, details };

      const response = await fetch("http://localhost:5000/api/inventory/movement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to update stock");

      setOpenPopup(null);
      fetchData(); // Refresh data from DB
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading Dashboard...</div>;

  return (
    <div className="app-layout">
      <Staff_Sidebar alertCount={stats.lowStock} />

      <main className="main-content">
        
        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Home</h1>
          </div>
          
          <div className="header-actions">
            <span className="sync-status">Synced just now</span>
            {/* Pass readOnly to prevent staff from switching stores */}
            <StoreOwner_StoreSwitcher readOnly />
            <StoreOwner_UserMenu
              name={userName}
              role="Staff"
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

        {/* Action Buttons Row */}
        <div className="staff-action-buttons">
          <button type="button" className="btn-primary" onClick={() => setOpenPopup("sale")}>Record sale</button>
          <button type="button" className="btn-outline" onClick={() => setOpenPopup("in")}>Stock in</button>
          <button type="button" className="btn-outline" onClick={() => setOpenPopup("out")}>Stock out</button>
          <button type="button" className="btn-outline" onClick={() => setOpenPopup("adjust")}>Adjust stock</button>
        </div>

        {/* Alert Banner */}
        {stats.lowStock > 0 && (
          <div className="alert-banner-danger">
            {stats.lowStock} products are below their reorder level. Review stock
          </div>
        )}

        {/* Top Stat Cards */}
        <div className="staff-stats-grid">
          <div className="stat-card">
            <span className="stat-label">My sales today</span>
            <h3 className="stat-value">R{stats.salesToday.toFixed(2)}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">My transactions today</span>
            <h3 className="stat-value">{stats.transactionsToday}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low stock</span>
            <h3 className="stat-value text-danger">{stats.lowStock}</h3>
          </div>
        </div>

        {/* Middle Row: Low Stock */}
        <div className="staff-row-2-col">
          <div className="card">
            <div className="card-header">
              <h3>Low stock</h3>
              <button type="button" className="btn-outline" onClick={() => navigate("/staff/stock")}>
                Open stock
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
                {products.filter(p => p.onHand <= p.reorder).slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.product}</td>
                    <td>{p.onHand}</td>
                    <td>{p.reorder}</td>
                    <td>
                      <span className={`status-pill ${p.onHand === 0 ? 'status-danger' : 'status-warning'}`}>
                        {p.onHand === 0 ? "Out of stock" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
                {products.filter(p => p.onHand <= p.reorder).length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: "center" }}>All stock is healthy!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Row: Recent Sales */}
        <div className="card recent-sales-card">
          <div className="card-header">
            <h3>My recent sales</h3>
            <button type="button" className="btn-outline" onClick={() => navigate("/staff/sales-history")}>
              Sales history
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>No recent sales.</td></tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.time}</td>
                    <td>{sale.items}</td>
                    <td>{sale.payment}</td>
                    <td>{sale.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* --- POPUPS --- */}
      {openPopup === "sale" && (
        <StoreOwner_RecordSale_popup
          products={products}
          onComplete={handleRecordSale}
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "in" && (
        <StockInPopup
          products={products}
          onSave={({ productId, quantity, supplier }) => handleSaveMovement(productId, quantity, "Stock in", supplier)}
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "out" && (
        <StockOutPopup
          products={products}
          onSave={({ productId, quantity, reason }) => handleSaveMovement(productId, -quantity, "Stock out", reason)}
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "adjust" && (
        <StockAdjustmentPopup
          products={products}
          onSave={({ productId, quantityBefore, quantityAfter, reason }) => {
            const diff = quantityAfter - quantityBefore;
            handleSaveMovement(productId, diff, "Adjustment", `${reason} (was ${quantityBefore})`);
          }}
          onClose={() => setOpenPopup(null)}
        />
      )}
    </div>
  );
};

export default StaffDashboard;