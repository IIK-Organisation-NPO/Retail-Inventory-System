// src/pages/Store Owner/StoreOwnerInventory.jsx
import { useNavigate } from "react-router-dom";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";

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

const StoreOwnerInventory = () => {
  const navigate = useNavigate();

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
            <button type="button" className="so-store-selector">
              <span className="so-avatar so-avatar-sm">MT</span>
              <span className="so-store-name">Mseleku Tuckshop</span>
              <span className="so-chevron" aria-hidden="true">⌄</span>
            </button>

            <button type="button" className="so-btn so-btn-primary">Stock in</button>
            <button type="button" className="so-btn so-btn-outline">Stock out</button>
            <button type="button" className="so-btn so-btn-outline">Adjust stock</button>

            <span className="so-avatar" title="Account">SD</span>
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
                {STOCK_ITEMS.map((item) => {
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
    </div>
  );
};

export default StoreOwnerInventory;
