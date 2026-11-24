// src/pages/Store Owner/StoreOwnerInventory.jsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import {
  StockInPopup,
  StockOutPopup,
  StockAdjustmentPopup,
} from "../../components/Store Owner/StoreOwner_StockIn_popup";

// Work out the stock status of a product from its quantity
const getStatus = (onHand, reorderLevel) => {
  if (onHand === 0) return { label: "Out", className: "out" };
  if (onHand < reorderLevel) return { label: "Low", className: "low" };
  return { label: "OK", className: "ok" };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-13T14:30:00" -> "13 Nov"
const formatShortDate = (isoString) => {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

// Fetches the inventory and works out the summary cards.
// It lives outside the component and never sets state, it only returns data.
const loadInventory = async (storeId, token) => {
  const response = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Failed to load inventory");

  let totalValue = 0;
  let lowCount = 0;
  let outCount = 0;

  const items = data.map((p) => {
    const onHand = Number(p.OnHand) || 0;
    const reorder = Number(p.ReorderLevel ?? 15);
    const cost = Number(p.CostPrice) || 0;

    totalValue += onHand * cost;
    if (onHand === 0) outCount++;
    else if (onHand < reorder) lowCount++;

    return {
      id: p.ProductID,
      product: p.Name,
      onHand,
      reorderLevel: reorder,
      lastMovement: p.LastMovementDate
        ? `Updated, ${formatShortDate(p.LastMovementDate)}`
        : "No recent movements",
      raw: p,
    };
  });

  return {
    items,
    summary: {
      inventoryValue: totalValue,
      lowStockProducts: lowCount,
      outOfStock: outCount,
      lastStockCount: formatShortDate(new Date()),
    },
  };
};

const StoreOwnerInventory = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Data State
  const [stockItems, setStockItems] = useState([]);
  const [summary, setSummary] = useState({
    inventoryValue: 0,
    lowStockProducts: 0,
    outOfStock: 0,
    lastStockCount: "N/A",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Popup State
  const [openPopup, setOpenPopup] = useState(() => (
    location.state?.openPopup === "in" ? "in" : null
  ));

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");

  // Puts freshly loaded data on the screen
  const applyInventory = useCallback(({ items, summary: newSummary }) => {
    setStockItems(items);
    setSummary(newSummary);
    setError("");
  }, []);

  // --- 1. LOAD ON PAGE OPEN (and when the store changes) ---
  // State is only set inside the .then callbacks.
  useEffect(() => {
    let cancelled = false;

    loadInventory(storeId, token)
      .then((result) => {
        if (!cancelled) applyInventory(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId, token, applyInventory]);

  // Reload after a stock movement (runs from a button click, not from an effect)
  const refreshInventory = useCallback(async () => {
    try {
      applyInventory(await loadInventory(storeId, token));
    } catch (err) {
      setError(err.message);
    }
  }, [storeId, token, applyInventory]);

  const closePopup = useCallback(() => setOpenPopup(null), []);

  // Clears the "open popup" hint that other pages pass in the navigation state
  useEffect(() => {
    if (location.state?.openPopup === "in") {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // --- 2. SUBMIT MOVEMENT TO BACKEND ---
  // Throws on failure so the popup can stay open and show the message.
  // The popup closes itself when this finishes without an error.
  const handleSaveMovement = async (movement) => {
    const response = await fetch("http://localhost:5000/api/inventory/movement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ storeId: Number(storeId), ...movement }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fieldMessages = data.errors ? Object.values(data.errors).join(" ") : "";
      throw new Error(fieldMessages || data.message || "Failed to update stock");
    }

    await refreshInventory(); // refresh table and summary cards from the database
  };

  if (loading) return <div style={{ padding: "50px" }}>Loading inventory...</div>;

  return (
    <div className="so-layout">
      <StoreOwnerSidebar notificationCount={summary.lowStockProducts} />

      <main className="so-main">
        <header className="so-header">
          <h1 className="so-page-title">Inventory</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />
            <button type="button" className="so-btn so-btn-primary" onClick={() => setOpenPopup("in")}>Stock in</button>
            <button type="button" className="so-btn so-btn-outline" onClick={() => setOpenPopup("out")}>Stock out</button>
            <button type="button" className="so-btn so-btn-outline" onClick={() => setOpenPopup("adjust")}>Adjust stock</button>
            <StoreOwner_UserMenu />
          </div>
        </header>

        {error && (
          <div style={{ color: "red", backgroundColor: "#ffebee", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
            {error}
          </div>
        )}

        {/* Summary cards */}
        <section className="so-stats">
          <div className="so-stat-card">
            <p className="so-stat-label">Inventory value</p>
            <p className="so-stat-value">R{summary.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Low stock products</p>
            <p className="so-stat-value so-stat-value-danger">{summary.lowStockProducts}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Out of stock</p>
            <p className="so-stat-value">{summary.outOfStock}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Today's Date</p>
            <p className="so-stat-value">{summary.lastStockCount}</p>
          </div>
        </section>

        {/* Stock levels table */}
        <section className="so-card">
          <div className="so-card-header">
            <h2 className="so-card-title">Stock levels</h2>
            <button type="button" className="so-link-btn" onClick={() => navigate("/store-owner/inventory/movement-history")}>
              Movement history
            </button>
          </div>

          <div className="so-table-wrapper">
            <table className="so-table">
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
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No products found. Add products first.</td></tr>
                ) : (
                  stockItems.map((item) => {
                    const status = getStatus(item.onHand, item.reorderLevel);
                    return (
                      <tr key={item.id}>
                        <td>{item.product}</td>
                        <td>{item.onHand}</td>
                        <td>{item.reorderLevel}</td>
                        <td>
                          <span className={`so-status so-status-${status.className}`}>{status.label}</span>
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

      {/* POPUPS: each one closes itself after a successful save */}
      {openPopup === "in" && (
        <StockInPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity, unitCost, supplier }) =>
            handleSaveMovement({
              productId,
              type: "Stock in",
              quantityChange: quantity,
              details: `${supplier} (unit cost R${unitCost.toFixed(2)})`,
            })
          }
        />
      )}

      {openPopup === "out" && (
        <StockOutPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity, reason }) =>
            handleSaveMovement({
              productId,
              type: "Stock out",
              quantityChange: -quantity,
              details: reason,
            })
          }
        />
      )}

      {openPopup === "adjust" && (
        <StockAdjustmentPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantityAfter, reason }) =>
            handleSaveMovement({
              productId,
              type: "Adjustment",
              newQuantity: quantityAfter,
              details: reason,
            })
          }
        />
      )}
    </div>
  );
};

export default StoreOwnerInventory;