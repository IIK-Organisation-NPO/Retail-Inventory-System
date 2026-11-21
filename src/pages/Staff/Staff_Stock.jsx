// src/pages/Staff/Staff_Stock.jsx
import { useCallback, useState } from "react";
import "../../Style/Staff/Staff_Layout.css";
import "../../Style/Staff/Staff_Stock.css";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import {
  Staff_StockInPopup,
  Staff_StockOutPopup,
  Staff_StockAdjustmentPopup,
} from "../../components/Staff/Staff_StockPopups";

// Mock data — replace with API data once the backend is connected
const STORE = { name: "Mseleku Tuckshop" };
const LAST_SYNCED = "2 min ago";

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

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

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

const Staff_Stock = () => {
  const [stockItems, setStockItems] = useState(STOCK_ITEMS);
  const [openPopup, setOpenPopup] = useState(null); // "in" | "out" | "adjust" | null

  const closePopup = useCallback(() => setOpenPopup(null), []);

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
    <div className="st-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <Staff_Sidebar alertCount={3} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="st-main">
        {/* Page header: title, sync status, store, actions, user avatar */}
        <header className="st-header">
          <h1 className="st-page-title">Stock</h1>

          <div className="st-header-actions">
            <span className="st-sync">Synced {LAST_SYNCED}</span>

            {/* Staff work in one store, so this is a label, not a switcher */}
            <div className="st-store-chip">
              <span className="st-avatar st-avatar-sm" aria-hidden="true">
                {getInitials(STORE.name)}
              </span>
              <span>{STORE.name}</span>
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
              name="Lindiwe Ngcobo"
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {/* Summary cards */}
        <section className="st-stats">
          <div className="st-stat-card">
            <p className="st-stat-label">Inventory value</p>
            <p className="st-stat-value">{SUMMARY.inventoryValue}</p>
          </div>
          <div className="st-stat-card">
            <p className="st-stat-label">Low stock products</p>
            <p className="st-stat-value st-stat-value-danger">{SUMMARY.lowStockProducts}</p>
          </div>
          <div className="st-stat-card">
            <p className="st-stat-label">Out of stock</p>
            <p className="st-stat-value">{SUMMARY.outOfStock}</p>
          </div>
          <div className="st-stat-card">
            <p className="st-stat-label">Last stock count</p>
            <p className="st-stat-value">{SUMMARY.lastStockCount}</p>
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
                {stockItems.map((item) => {
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
        <Staff_StockInPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity, date }) =>
            applyMovement(productId, (onHand) => onHand + quantity, "Stock in", date)
          }
        />
      )}

      {openPopup === "out" && (
        <Staff_StockOutPopup
          products={stockItems}
          onClose={closePopup}
          onSave={({ productId, quantity, date }) =>
            applyMovement(productId, (onHand) => onHand - quantity, "Stock out", date)
          }
        />
      )}

      {openPopup === "adjust" && (
        <Staff_StockAdjustmentPopup
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

export default Staff_Stock;
