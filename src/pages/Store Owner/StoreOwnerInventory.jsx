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

// Mock data — replace with API data once the backend is connected
const SUMMARY = {
  inventoryValue: "R48,549",
  lowStockProducts: 5,
  outOfStock: 0,
  lastStockCount: "12 Nov",
};

const STOCK_ITEMS = [
  { id: 1, product: "Simba Chips Original", onHand: 38, reorderLevel: 15, lastMovement: "Sale, 13 Nov" },
  { id: 2, product: "Lay's Salt & Vinegar", onHand: 24, reorderLevel: 15, lastMovement: "Stock in, 11 Nov" },
  { id: 3, product: "NikNaks Cheese", onHand: 66, reorderLevel: 15, lastMovement: "Sale, 13 Nov" },
  { id: 4, product: "Coca-Cola 500ml", onHand: 89, reorderLevel: 15, lastMovement: "Adjustment, 12 Nov" },
  { id: 5, product: "Fanta Orange 500ml", onHand: 12, reorderLevel: 15, lastMovement: "Stock out, 10 Nov" },
  { id: 6, product: "Sprite 500ml", onHand: 55, reorderLevel: 15, lastMovement: "Sale, 12 Nov" },
];

// Work out the stock status of a product from its quantity
const getStatus = (onHand, reorderLevel) => {
  if (onHand === 0) return { label: "Out", className: "out" };
  if (onHand < reorderLevel) return { label: "Low", className: "low" };
  return { label: "OK", className: "ok" };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-13" -> "13 Nov"
const formatShortDate = (iso) => {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

const StoreOwnerInventory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState(STOCK_ITEMS);
  const [openPopup, setOpenPopup] = useState(() => (
    location.state?.openPopup === "in" ? "in" : null
  )); // "in" | "out" | "adjust" | null

  const closePopup = useCallback(() => setOpenPopup(null), []);

  useEffect(() => {
    if (location.state?.openPopup === "in") {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // Update one product's quantity and last movement after a popup is saved
  const applyMovement = (productId, getNewOnHand, label, date) => {
    setStockItems((items) =>
      items.map((item) =>
        item.id === productId
          ? { ...item, onHand: getNewOnHand(item.onHand), lastMovement: `${label}, ${formatShortDate(date)}` }
          : item
      )
    );
  };

  return (
    <div className="so-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <StoreOwnerSidebar notificationCount={3} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="so-main">
        {/* Page header: title, store selector, actions, user avatar */}
        <header className="so-header">
          <h1 className="so-page-title">Inventory</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />

            <button type="button" className="so-btn so-btn-primary" onClick={() => setOpenPopup("in")}>
              Stock in
            </button>
            <button type="button" className="so-btn so-btn-outline" onClick={() => setOpenPopup("out")}>
              Stock out
            </button>
            <button type="button" className="so-btn so-btn-outline" onClick={() => setOpenPopup("adjust")}>
              Adjust stock
            </button>

            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Summary cards */}
        <section className="so-stats">
          <div className="so-stat-card">
            <p className="so-stat-label">Inventory value</p>
            <p className="so-stat-value">{SUMMARY.inventoryValue}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Low stock products</p>
            <p className="so-stat-value so-stat-value-danger">{SUMMARY.lowStockProducts}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Out of stock</p>
            <p className="so-stat-value">{SUMMARY.outOfStock}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Last stock count</p>
            <p className="so-stat-value">{SUMMARY.lastStockCount}</p>
          </div>
        </section>

        {/* Stock levels table */}
        <section className="so-card">
          <div className="so-card-header">
            <h2 className="so-card-title">Stock levels</h2>
            <button
              type="button"
              className="so-link-btn"
              onClick={() => navigate("/store-owner/inventory/movement-history")}
            >
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
                {stockItems.map((item) => {
                  const status = getStatus(item.onHand, item.reorderLevel);
                  return (
                    <tr key={item.id}>
                      <td>{item.product}</td>
                      <td>{item.onHand}</td>
                      <td>{item.reorderLevel}</td>
                      <td>
                        <span className={`so-status so-status-${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>{item.lastMovement}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* =========================================
          POPUPS
          ========================================= */}
      {openPopup === "in" && (
        <StockInPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity, date }) =>
            applyMovement(productId, (onHand) => onHand + quantity, "Stock in", date)
          }
        />
      )}

      {openPopup === "out" && (
        <StockOutPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity, date }) =>
            applyMovement(productId, (onHand) => onHand - quantity, "Stock out", date)
          }
        />
      )}

      {openPopup === "adjust" && (
        <StockAdjustmentPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantityAfter, date }) =>
            applyMovement(productId, () => quantityAfter, "Adjustment", date)
          }
        />
      )}
    </div>
  );
};

export default StoreOwnerInventory;
