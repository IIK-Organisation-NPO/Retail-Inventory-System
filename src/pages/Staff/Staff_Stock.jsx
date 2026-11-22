// src/pages/Staff/Staff_Stock.jsx
import { useCallback, useState, useEffect } from "react";
import "../../Style/Staff/Staff_Layout.css";
import "../../Style/Staff/Staff_Stock.css";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import {
  Staff_StockInPopup,
  Staff_StockOutPopup,
  Staff_StockAdjustmentPopup,
} from "../../components/Staff/Staff_StockPopups";

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

// Work out the stock status of a product from its quantity
const getStatus = (onHand, reorderLevel) => {
  if (onHand === 0) return { label: "Out", className: "out" };
  if (onHand < reorderLevel) return { label: "Low", className: "low" };
  return { label: "OK", className: "ok" };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-13" -> "13 Nov"
const formatShortDate = (isoString) => {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const Staff_Stock = () => {
  // Data State
  const [stockItems, setStockItems] = useState([]);
  const [summary, setSummary] = useState({
    inventoryValue: 0,
    lowStockProducts: 0,
    outOfStock: 0,
    lastStockCount: "N/A",
  });
  const [storeName, setStoreName] = useState("My Store");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [openPopup, setOpenPopup] = useState(null);

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Staff Member";

  // --- 1. FETCH REAL DATA ---
  const fetchData = async () => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // Fetch Products
      const prodRes = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, { headers });
      const data = await prodRes.json();
      
      if (!prodRes.ok) throw new Error(data.message);

      let totalValue = 0;
      let lowCount = 0;
      let outCount = 0;

      const formattedItems = data.map((p) => {
        const onHand = p.OnHand || 0;
        const reorder = p.ReorderLevel || 15;
        const cost = Number(p.CostPrice) || 0;
        
        // Calculate summaries
        totalValue += (onHand * cost);
        if (onHand === 0) outCount++;
        else if (onHand < reorder) lowCount++;

        return {
          id: p.ProductID,
          product: p.Name,
          onHand: onHand,
          reorderLevel: reorder,
          lastMovement: p.LastMovementDate ? `Updated, ${formatShortDate(p.LastMovementDate)}` : "No recent movements",
        };
      });

      setStockItems(formattedItems);
      setSummary({
        inventoryValue: totalValue,
        lowStockProducts: lowCount,
        outOfStock: outCount,
        lastStockCount: formatShortDate(new Date()),
      });

      // Fetch Store Name
      const storeRes = await fetch(`http://localhost:5000/api/stores/my-stores`, { headers });
      const storeData = await storeRes.json();
      if (storeRes.ok && storeData.length > 0) {
        const currentStore = storeData.find(s => s.StoreID === Number(storeId));
        if (currentStore) setStoreName(currentStore.StoreName);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [storeId, token]);

  const closePopup = useCallback(() => setOpenPopup(null), []);

  // --- 2. SAVE MOVEMENT TO BACKEND ---
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

      closePopup();
      fetchData(); // Refresh table and stats from DB
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading stock...</div>;

  return (
    <div className="st-layout">
      <Staff_Sidebar alertCount={summary.lowStockProducts} />

      <main className="st-main">
        <header className="st-header">
          <h1 className="st-page-title">Stock</h1>

          <div className="st-header-actions">
            <span className="st-sync">Synced just now</span>

            <div className="st-store-chip">
              <span className="st-avatar st-avatar-sm" aria-hidden="true">
                {getInitials(storeName)}
              </span>
              <span>{storeName}</span>
            </div>

            <button type="button" className="st-btn st-btn-primary" onClick={() => setOpenPopup("in")}>
              Stock in
            </button>
            <button type="button" className="st-btn st-btn-outline" onClick={() => setOpenPopup("out")}>
              Stock out
            </button>
            <button type="button" className="st-btn st-btn-outline" onClick={() => setOpenPopup("adjust")}>
              Adjust stock
            </button>

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

        {/* Summary cards */}
        <section className="st-stats">
          <div className="st-stat-card">
            <p className="st-stat-label">Inventory value</p>
            <p className="st-stat-value">
              R{summary.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="st-stat-card">
            <p className="st-stat-label">Low stock products</p>
            <p className="st-stat-value st-stat-value-danger">{summary.lowStockProducts}</p>
          </div>
          <div className="st-stat-card">
            <p className="st-stat-label">Out of stock</p>
            <p className="st-stat-value">{summary.outOfStock}</p>
          </div>
          <div className="st-stat-card">
            <p className="st-stat-label">Today's Date</p>
            <p className="st-stat-value">{summary.lastStockCount}</p>
          </div>
        </section>

        {/* Stock levels table */}
        <section className="st-card">
          <h2 className="st-card-title">Stock levels</h2>

          <div className="st-table-wrapper">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>On hand</th>
                  <th>Reorder level</th>
                  <th>Status</th>
                  <th>Last movement</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign: "center", padding: "20px"}}>No products found.</td></tr>
                ) : (
                  stockItems.map((item) => {
                    const status = getStatus(item.onHand, item.reorderLevel);
                    return (
                      <tr key={item.id}>
                        <td>{item.product}</td>
                        <td>{item.onHand}</td>
                        <td>{item.reorderLevel}</td>
                        <td>
                          <span className={`st-status st-status-${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>{item.lastMovement}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* POPUPS */}
      {openPopup === "in" && (
        <Staff_StockInPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity }) =>
            handleSaveMovement(productId, quantity, "Stock in", "Stock in by Staff")
          }
        />
      )}

      {openPopup === "out" && (
        <Staff_StockOutPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity }) =>
            handleSaveMovement(productId, -quantity, "Stock out", "Stock out by Staff")
          }
        />
      )}

      {openPopup === "adjust" && (
        <Staff_StockAdjustmentPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantityAfter }) => {
            const currentItem = stockItems.find(i => i.id === productId);
            const diff = quantityAfter - currentItem.onHand;
            handleSaveMovement(productId, diff, "Adjustment", "Adjustment by Staff");
          }}
        />
      )}
    </div>
  );
};

export default Staff_Stock;