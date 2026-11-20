// src/components/Store Owner/StoreOwner_StockIn_popup.jsx
// Inventory popups: Stock in, Stock out and Stock adjustment
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";

const DEFAULT_SUPPLIERS = ["Tiger Brands Ltd", "Coca-Cola Beverages SA", "PepsiCo SA"];

const STOCK_OUT_REASONS = ["Damaged", "Expired", "Theft or loss", "Own use", "Returned to supplier"];

const ADJUSTMENT_REASONS = ["Stock count", "Data entry correction", "Found stock", "Other"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Today's date for display, e.g. "17 Nov 2026"
const formatToday = () => {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// Today's date as YYYY-MM-DD (local time) — the date saved with every movement
const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// True for whole numbers >= min, e.g. "12"
const isWholeNumber = (value, min) =>
  value !== "" && Number.isInteger(Number(value)) && Number(value) >= min;

const findProduct = (products, productId) =>
  products.find((p) => String(p.id) === productId);

/* =========================================================
   SHARED: POPUP SHELL
   Backdrop, card, header and close button used by all three
   ========================================================= */
export const PopupShell = ({ title, onClose, children }) => {
  // Close on Escape and stop the page behind the popup from scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    // Clicking the dark backdrop (outside the popup) closes it
    <div
      className="sp-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sp-modal" role="dialog" aria-modal="true" aria-labelledby="sp-title">
        <div className="sp-header">
          <h2 id="sp-title" className="sp-title">{title}</h2>
          <button type="button" className="sp-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

/* Shared: Product dropdown */
const ProductSelect = ({ id, products, value, onChange }) => (
  <div className="sp-field">
    <label htmlFor={id}>Product</label>
    <select id={id} className="sp-input sp-select" value={value} onChange={onChange} autoFocus>
      {products.map((p) => (
        <option key={p.id} value={String(p.id)}>{p.product}</option>
      ))}
    </select>
  </div>
);

/* Shared: Date — always today's date and cannot be changed */
const DateField = ({ id }) => (
  <div className="sp-field">
    <label htmlFor={id}>Date</label>
    <div className="sp-date-wrapper">
      <input
        id={id}
        type="text"
        className="sp-input sp-date"
        value={formatToday()}
        readOnly
        tabIndex={-1}
        aria-readonly="true"
      />
      {/* Calendar icon (decoration only) */}
      <svg className="sp-date-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

/* Shared: Save + Cancel buttons */
const PopupActions = ({ saveLabel, onClose }) => (
  <div className="sp-actions">
    <button type="submit" className="sp-btn sp-btn-primary">{saveLabel}</button>
    <button type="button" className="sp-btn sp-btn-outline" onClick={onClose}>Cancel</button>
  </div>
);

/* =========================================================
   1. STOCK IN POPUP  (opened by the "Stock in" button)
   ========================================================= */
export const StockInPopup = ({ products, suppliers = DEFAULT_SUPPLIERS, onSave, onClose }) => {
  const [productId, setProductId] = useState(String(products[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState(suppliers[0] ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isWholeNumber(quantity, 1)) {
      setError("Enter a quantity of at least 1.");
      return;
    }
    if (unitCost === "" || Number.isNaN(Number(unitCost)) || Number(unitCost) < 0) {
      setError("Enter the unit cost in rand.");
      return;
    }

    onSave?.({
      productId: findProduct(products, productId)?.id,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      supplier,
      date: todayISO(),
    });
    onClose();
  };

  return (
    <PopupShell title="Stock in" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ProductSelect
          id="stock-in-product"
          products={products}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />

        <div className="sp-field">
          <label htmlFor="stock-in-quantity">Quantity</label>
          <input
            id="stock-in-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            className="sp-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="sp-field">
          <label htmlFor="stock-in-cost">Unit cost (R)</label>
          <input
            id="stock-in-cost"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className="sp-input"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        <div className="sp-field">
          <label htmlFor="stock-in-supplier">Supplier</label>
          <select
            id="stock-in-supplier"
            className="sp-input sp-select"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            {suppliers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <DateField id="stock-in-date" />

        {error && <p className="sp-error">{error}</p>}

        <PopupActions saveLabel="Save stock in" onClose={onClose} />
      </form>
    </PopupShell>
  );
};

/* =========================================================
   2. STOCK OUT POPUP  (opened by the "Stock out" button)
   ========================================================= */
export const StockOutPopup = ({ products, onSave, onClose }) => {
  const [productId, setProductId] = useState(String(products[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(STOCK_OUT_REASONS[0]);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const product = findProduct(products, productId);

    if (!isWholeNumber(quantity, 1)) {
      setError("Enter a quantity of at least 1.");
      return;
    }
    if (product && Number(quantity) > product.onHand) {
      setError(`You only have ${product.onHand} of ${product.product} in stock.`);
      return;
    }

    onSave?.({
      productId: product?.id,
      quantity: Number(quantity),
      reason,
      date: todayISO(),
    });
    onClose();
  };

  return (
    <PopupShell title="Stock out" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ProductSelect
          id="stock-out-product"
          products={products}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />

        <div className="sp-field">
          <label htmlFor="stock-out-quantity">Quantity</label>
          <input
            id="stock-out-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            className="sp-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="sp-field">
          <label htmlFor="stock-out-reason">Reason</label>
          <select
            id="stock-out-reason"
            className="sp-input sp-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {STOCK_OUT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <DateField id="stock-out-date" />

        {error && <p className="sp-error">{error}</p>}

        <PopupActions saveLabel="Save stock out" onClose={onClose} />
      </form>
    </PopupShell>
  );
};

/* =========================================================
   3. STOCK ADJUSTMENT POPUP  (opened by the "Adjust stock" button)
   ========================================================= */
export const StockAdjustmentPopup = ({ products, onSave, onClose }) => {
  const [productId, setProductId] = useState(String(products[0]?.id ?? ""));
  const [quantityAfter, setQuantityAfter] = useState("");
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0]);
  const [error, setError] = useState("");

  // "Quantity before" is the system's current stock for the chosen product
  const product = findProduct(products, productId);
  const quantityBefore = product?.onHand ?? "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isWholeNumber(quantityAfter, 0)) {
      setError("Enter the new quantity (0 or more).");
      return;
    }

    onSave?.({
      productId: product?.id,
      quantityBefore: Number(quantityBefore),
      quantityAfter: Number(quantityAfter),
      reason,
      date: todayISO(),
    });
    onClose();
  };

  return (
    <PopupShell title="Stock adjustment" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ProductSelect
          id="adjust-product"
          products={products}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />

        {/* Before and after side by side */}
        <div className="sp-row">
          <div className="sp-field">
            <label htmlFor="adjust-before">Quantity before</label>
            <input
              id="adjust-before"
              type="number"
              className="sp-input"
              value={quantityBefore}
              readOnly
              tabIndex={-1}
            />
          </div>

          <div className="sp-field">
            <label htmlFor="adjust-after">Quantity after</label>
            <input
              id="adjust-after"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              className="sp-input"
              value={quantityAfter}
              onChange={(e) => setQuantityAfter(e.target.value)}
            />
          </div>
        </div>

        <div className="sp-field">
          <label htmlFor="adjust-reason">Reason</label>
          <select
            id="adjust-reason"
            className="sp-input sp-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {ADJUSTMENT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <DateField id="adjust-date" />

        {error && <p className="sp-error">{error}</p>}

        <PopupActions saveLabel="Save adjustment" onClose={onClose} />
      </form>
    </PopupShell>
  );
};