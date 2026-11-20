import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import { STAFF_STORE } from "../../data/stores";
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
  const [products, setProducts] = useState([
    { id: 1, product: "Coca-Cola 500ml", price: 26.5, onHand: 89, barcode: "5449000000996" },
    { id: 2, product: "Simba Chips Original", price: 14.63, onHand: 38, barcode: "6001234500028" },
    { id: 3, product: "Sprite 500ml", price: 21.45, onHand: 55, barcode: "6001234500035" },
    { id: 4, product: "NikNaks Cheese", price: 15, onHand: 66, barcode: "6001234500042" },
    { id: 5, product: "Fanta Orange 500ml", price: 20.55, onHand: 12, barcode: "6001234500059" },
    { id: 6, product: "Ace Maize Meal 2.5kg", price: 64.03, onHand: 20, barcode: "6001234500066" },
    { id: 7, product: "Lay's Salt & Vinegar", price: 18.99, onHand: 24, barcode: "6001234500073" },
  ]);
  const [openPopup, setOpenPopup] = useState(null);

  const updateProductStock = (productId, update) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, onHand: update(product.onHand) } : product
      )
    );
  };

  // Dummy data for recent sales
  const recentSales = [
    { time: "16:42", items: "Coca-Cola 500ml ×2, Simba Chips Original ×1", payment: "Cash", total: "R67.63" },
    { time: "14:20", items: "Fanta Orange 500ml ×1", payment: "Card", total: "R20.55" },
    { time: "13:55", items: "Sprite 500ml ×3", payment: "Cash", total: "R64.35" },
    { time: "11:40", items: "NikNaks Cheese ×2", payment: "Cash", total: "R30.00" },
    { time: "09:05", items: "Fanta Orange 500ml ×2", payment: "Cash", total: "R41.10" },
  ];

  return (
    <div className="app-layout">
      <Staff_Sidebar alertCount={3} />

      <main className="main-content">
        
        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Home</h1>
          </div>
          
          <div className="header-actions">
            <span className="sync-status">Synced 2 min ago</span>
            <StoreOwner_StoreSwitcher stores={[STAFF_STORE]} readOnly />
            <StoreOwner_UserMenu
              name="Lindiwe Ngcobo"
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {/* Action Buttons Row */}
        <div className="staff-action-buttons">
          <button type="button" className="btn-primary" onClick={() => setOpenPopup("sale")}>Record sale</button>
          <button type="button" className="btn-outline" onClick={() => setOpenPopup("in")}>Stock in</button>
          <button type="button" className="btn-outline" onClick={() => setOpenPopup("out")}>Stock out</button>
          <button type="button" className="btn-outline" onClick={() => setOpenPopup("adjust")}>Adjust stock</button>
        </div>

        {/* Alert Banner */}
        <div className="alert-banner-danger">
          3 products are below their reorder level. Review stock
        </div>

        {/* Top Stat Cards */}
        <div className="staff-stats-grid">
          <div className="stat-card">
            <span className="stat-label">My sales today</span>
            <h3 className="stat-value">R223.63</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">My transactions today</span>
            <h3 className="stat-value">5</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low stock</span>
            <h3 className="stat-value text-danger">3</h3>
          </div>
        </div>

        {/* Middle Row: Top Selling & Low Stock */}
        <div className="staff-row-2-col">
          
          {/* Top Selling */}
          <div className="card top-selling-card">
            <div className="card-header">
              <h3>Top-selling today (store)</h3>
            </div>
            <ul className="top-selling-list">
              <li>
                <span>Coca-Cola 500ml</span>
                <strong>48 sold</strong>
              </li>
              <li>
                <span>Simba Chips Original</span>
                <strong>35 sold</strong>
              </li>
              <li>
                <span>White Star Maize Meal 2.5kg</span>
                <strong>21 sold</strong>
              </li>
            </ul>
          </div>

          {/* Low Stock */}
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
                <tr>
                  <td>Rama Margarine 500g</td>
                  <td>0</td>
                  <td>6</td>
                  <td><span className="status-pill status-danger">Out of stock</span></td>
                </tr>
                <tr>
                  <td>Clover Fresh Milk 1L</td>
                  <td>9</td>
                  <td>15</td>
                  <td><span className="status-pill status-warning">Low</span></td>
                </tr>
                <tr>
                  <td>Sasko Premium Bread</td>
                  <td>12</td>
                  <td>15</td>
                  <td><span className="status-pill status-warning">Low</span></td>
                </tr>
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
              {recentSales.map((sale, index) => (
                <tr key={index}>
                  <td>{sale.time}</td>
                  <td>{sale.items}</td>
                  <td>{sale.payment}</td>
                  <td>{sale.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
      {openPopup === "sale" && (
        <StoreOwner_RecordSale_popup
          products={products}
          onComplete={({ items }) =>
            items.forEach(({ productId, qty }) =>
              updateProductStock(productId, (onHand) => onHand - qty)
            )
          }
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "in" && (
        <StockInPopup
          products={products}
          onSave={({ productId, quantity }) =>
            updateProductStock(productId, (onHand) => onHand + quantity)
          }
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "out" && (
        <StockOutPopup
          products={products}
          onSave={({ productId, quantity }) =>
            updateProductStock(productId, (onHand) => onHand - quantity)
          }
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "adjust" && (
        <StockAdjustmentPopup
          products={products}
          onSave={({ productId, quantityAfter }) =>
            updateProductStock(productId, () => quantityAfter)
          }
          onClose={() => setOpenPopup(null)}
        />
      )}
    </div>
  );
};

export default StaffDashboard;