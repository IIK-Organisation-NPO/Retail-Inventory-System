// src/components/Staff/Staff_StockPopups.jsx
// Staff stock popups: Stock in, Stock out and Stock adjustment
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../Style/Staff/Staff_StockPopups.css";

// Mock data — replace with the store's suppliers from the API
const DEFAULT_SUPPLIERS = ["Tiger Brands Ltd", "Coca-Cola Beverages SA", "PepsiCo SA"];

const STOCK_OUT_REASONS = ["Damaged", "Expired", "Theft or loss", "Own use", "Returned to supplier"];

const ADJUSTMENT_REASONS = ["Stock count", "Data entry correction", "Found stock", "Other"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Today's date for display, e.g. "13 Nov 2026"
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
   (also used by Staff_PeriodPopup)
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
      className="stp-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="stp-modal" role="dialog" aria-modal="true" aria-labelledby="stp-title">
        <div className="stp-header">
          <h2 id="stp-title" className="stp-title">{title}</h2>
          <button type="button" className="stp-close" aria-label="Close" onClick={onClose}>
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
  <div className="stp-field">
    <label htmlFor={id}>Product</label>
    <select id={id} className="stp-input stp-select" value={value} onChange={onChange} autoFocus>
      {products.map((p) => (
        <option key={p.id} value={String(p.id)}>{p.product}</option>
      ))}
    </select>
  </div>
);

/* Shared: Reason / Supplier dropdown */
const OptionSelect = ({ id, label, options, value, onChange }) => (
  <div className="stp-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} className="stp-input stp-select" value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

/* Shared: Date — always today's date and cannot be changed */
const DateField = ({ id }) => (
  <div className="stp-field">
    <label htmlFor={id}>Date</label>
    <div className="stp-date-wrapper">
      <input
        id={id}
        type="text"
        className="stp-input stp-date"
        value={formatToday()}
        readOnly
        tabIndex={-1}
        aria-readonly="true"
      />
      {/* Calendar icon (decoration only) */}
      <svg className="stp-date-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

/* Shared: Save + Cancel buttons */
const PopupActions = ({ saveLabel, onClose }) => (
  <div className="stp-actions">
    <button type="submit" className="stp-btn stp-btn-primary">{saveLabel}</button>
    <button type="button" className="stp-btn stp-btn-outline" onClick={onClose}>Cancel</button>
  </div>
);

/* =========================================================
   1. STOCK IN POPUP  (opened by the "Stock in" button)
   ========================================================= */
export const Staff_StockInPopup = ({ products, suppliers = DEFAULT_SUPPLIERS, onSave, onClose }) => {
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
          id="staff-stock-in-product"
          products={products}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />

        <div className="stp-field">
          <label htmlFor="staff-stock-in-quantity">Quantity</label>
          <input
            id="staff-stock-in-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            className="stp-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="stp-field">
          <label htmlFor="staff-stock-in-cost">Unit cost (R)</label>
          <input
            id="staff-stock-in-cost"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className="stp-input"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        <OptionSelect
          id="staff-stock-in-supplier"
          label="Supplier"
          options={suppliers}
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        />

        <DateField id="staff-stock-in-date" />

        {error && <p className="stp-error">{error}</p>}

        <PopupActions saveLabel="Save stock in" onClose={onClose} />
      </form>
    </PopupShell>
  );
};

/* =========================================================
   2. STOCK OUT POPUP  (opened by the "Stock out" button)
   ========================================================= */
export const Staff_StockOutPopup = ({ products, onSave, onClose }) => {
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
          id="staff-stock-out-product"
          products={products}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />

        <div className="stp-field">
          <label htmlFor="staff-stock-out-quantity">Quantity</label>
          <input
            id="staff-stock-out-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            className="stp-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <OptionSelect
          id="staff-stock-out-reason"
          label="Reason"
          options={STOCK_OUT_REASONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <DateField id="staff-stock-out-date" />

        {error && <p className="stp-error">{error}</p>}

        <PopupActions saveLabel="Save stock out" onClose={onClose} />
      </form>
    </PopupShell>
  );
};

/* =========================================================
   3. STOCK ADJUSTMENT POPUP  (opened by the "Adjust stock" button)
   ========================================================= */
export const Staff_StockAdjustmentPopup = ({ products, onSave, onClose }) => {
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
          id="staff-adjust-product"
          products={products}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />

        {/* Before and after side by side */}
        <div className="stp-row">
          <div className="stp-field">
            <label htmlFor="staff-adjust-before">Quantity before</label>
            <input
              id="staff-adjust-before"
              type="number"
              className="stp-input"
              value={quantityBefore}
              readOnly
              tabIndex={-1}
            />
          </div>

          <div className="stp-field">
            <label htmlFor="staff-adjust-after">Quantity after</label>
            <input
              id="staff-adjust-after"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              className="stp-input"
              value={quantityAfter}
              onChange={(e) => setQuantityAfter(e.target.value)}
            />
          </div>
        </div>

        <OptionSelect
          id="staff-adjust-reason"
          label="Reason"
          options={ADJUSTMENT_REASONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <DateField id="staff-adjust-date" />

        {error && <p className="stp-error">{error}</p>}

        <PopupActions saveLabel="Save adjustment" onClose={onClose} />
      </form>
    </PopupShell>
  );
};