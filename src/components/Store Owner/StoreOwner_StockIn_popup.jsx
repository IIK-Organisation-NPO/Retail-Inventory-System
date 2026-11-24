// src/components/Store Owner/StoreOwner_StockIn_popup.jsx
// Inventory popups: Stock in, Stock out and Stock adjustment
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";

const DEFAULT_SUPPLIERS = ["Tiger Brands Ltd", "Coca-Cola Beverages SA", "PepsiCo SA"];

const STOCK_OUT_REASONS = ["Damaged", "Expired", "Theft or loss", "Own use", "Returned to supplier"];

const ADJUSTMENT_REASONS = ["Stock count", "Data entry correction", "Found stock", "Other"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MAX_QTY = 100000;

// Validation messages: red, directly under the field they belong to
const ERROR_COLOR = "#c62828";
const errorStyle = { color: ERROR_COLOR, fontSize: "0.85rem", margin: "6px 0 0" };
const redBorder = (invalid) => (invalid ? { borderColor: ERROR_COLOR } : undefined);

// Today's date for display, e.g. "17 Nov 2026"
const formatToday = () => {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// Today's date as YYYY-MM-DD (local time)
const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// True for whole numbers between min and MAX_QTY, e.g. "12"
const isWholeNumber = (value, min) =>
  String(value).trim() !== "" &&
  Number.isInteger(Number(value)) &&
  Number(value) >= min &&
  Number(value) <= MAX_QTY;

const findProduct = (products, productId) =>
  products.find((p) => String(p.id) === productId);

// Handles saving: waits for the server, closes on success, shows the error on failure
const useSubmit = (onSave, onClose) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const submit = async (data) => {
    setSubmitting(true);
    setServerError("");
    try {
      await onSave?.(data);
      onClose();
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return { submit, submitting, serverError };
};

/* =========================================================
   SHARED: POPUP SHELL
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

/* Shared: red message shown under a field */
const FieldError = ({ message }) =>
  message ? (
    <p role="alert" style={errorStyle}>
      {message}
    </p>
  ) : null;

/* Shared: Product dropdown */
const ProductSelect = ({ id, products, value, onChange, error }) => (
  <div className="sp-field">
    <label htmlFor={id}>Product</label>
    <select
      id={id}
      className="sp-input sp-select"
      style={redBorder(Boolean(error))}
      value={value}
      onChange={onChange}
      autoFocus
    >
      {products.length === 0 && <option value="">No products available</option>}
      {products.map((p) => (
        <option key={p.id} value={String(p.id)}>{p.product}</option>
      ))}
    </select>
    <FieldError message={error} />
  </div>
);

/* Shared: Date, always today and cannot be changed */
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
      <svg className="sp-date-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

/* Shared: Save + Cancel buttons */
const PopupActions = ({ saveLabel, onClose, submitting }) => (
  <div className="sp-actions">
    <button type="submit" className="sp-btn sp-btn-primary" disabled={submitting}>
      {submitting ? "Saving..." : saveLabel}
    </button>
    <button type="button" className="sp-btn sp-btn-outline" onClick={onClose} disabled={submitting}>
      Cancel
    </button>
  </div>
);

/* =========================================================
   1. STOCK IN POPUP
   ========================================================= */
export const StockInPopup = ({ products, suppliers = DEFAULT_SUPPLIERS, onSave, onClose }) => {
  const [productId, setProductId] = useState(String(products[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState(suppliers[0] ?? "");
  const [errors, setErrors] = useState({});
  const { submit, submitting, serverError } = useSubmit(onSave, onClose);

  const clear = (key) => setErrors((prev) => ({ ...prev, [key]: "" }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const product = findProduct(products, productId);
    const next = {};

    if (!product) next.productId = "Select a product.";
    if (!isWholeNumber(quantity, 1)) next.quantity = `Enter a whole number between 1 and ${MAX_QTY}.`;
    if (unitCost.trim() === "" || Number.isNaN(Number(unitCost)) || Number(unitCost) < 0)
      next.unitCost = "Enter the unit cost in rand (0 or more).";
    if (!supplier) next.supplier = "Select a supplier.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submit({
      productId: product.id,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      supplier,
      date: todayISO(),
    });
  };

  return (
    <PopupShell title="Stock in" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ProductSelect
          id="stock-in-product"
          products={products}
          value={productId}
          onChange={(e) => { setProductId(e.target.value); clear("productId"); }}
          error={errors.productId}
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
            style={redBorder(Boolean(errors.quantity))}
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); clear("quantity"); }}
          />
          <FieldError message={errors.quantity} />
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
            style={redBorder(Boolean(errors.unitCost))}
            value={unitCost}
            onChange={(e) => { setUnitCost(e.target.value); clear("unitCost"); }}
          />
          <FieldError message={errors.unitCost} />
        </div>

        <div className="sp-field">
          <label htmlFor="stock-in-supplier">Supplier</label>
          <select
            id="stock-in-supplier"
            className="sp-input sp-select"
            style={redBorder(Boolean(errors.supplier))}
            value={supplier}
            onChange={(e) => { setSupplier(e.target.value); clear("supplier"); }}
          >
            {suppliers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError message={errors.supplier} />
        </div>

        <DateField id="stock-in-date" />

        <FieldError message={serverError} />

        <PopupActions saveLabel="Save stock in" onClose={onClose} submitting={submitting} />
      </form>
    </PopupShell>
  );
};

/* =========================================================
   2. STOCK OUT POPUP
   ========================================================= */
export const StockOutPopup = ({ products, onSave, onClose }) => {
  const [productId, setProductId] = useState(String(products[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(STOCK_OUT_REASONS[0]);
  const [errors, setErrors] = useState({});
  const { submit, submitting, serverError } = useSubmit(onSave, onClose);

  const product = findProduct(products, productId);
  const clear = (key) => setErrors((prev) => ({ ...prev, [key]: "" }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};

    if (!product) {
      next.productId = "Select a product.";
    } else if (product.onHand === 0) {
      next.productId = `${product.product} is out of stock.`;
    }

    if (!isWholeNumber(quantity, 1)) {
      next.quantity = `Enter a whole number between 1 and ${MAX_QTY}.`;
    } else if (product && Number(quantity) > product.onHand) {
      next.quantity = `You only have ${product.onHand} of ${product.product} in stock.`;
    }

    if (!reason) next.reason = "Select a reason.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submit({
      productId: product.id,
      quantity: Number(quantity),
      reason,
      date: todayISO(),
    });
  };

  return (
    <PopupShell title="Stock out" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ProductSelect
          id="stock-out-product"
          products={products}
          value={productId}
          onChange={(e) => { setProductId(e.target.value); clear("productId"); clear("quantity"); }}
          error={errors.productId}
        />

        <div className="sp-field">
          <label htmlFor="stock-out-quantity">
            Quantity{product ? ` (in stock: ${product.onHand})` : ""}
          </label>
          <input
            id="stock-out-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            className="sp-input"
            style={redBorder(Boolean(errors.quantity))}
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); clear("quantity"); }}
          />
          <FieldError message={errors.quantity} />
        </div>

        <div className="sp-field">
          <label htmlFor="stock-out-reason">Reason</label>
          <select
            id="stock-out-reason"
            className="sp-input sp-select"
            style={redBorder(Boolean(errors.reason))}
            value={reason}
            onChange={(e) => { setReason(e.target.value); clear("reason"); }}
          >
            {STOCK_OUT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <FieldError message={errors.reason} />
        </div>

        <DateField id="stock-out-date" />

        <FieldError message={serverError} />

        <PopupActions saveLabel="Save stock out" onClose={onClose} submitting={submitting} />
      </form>
    </PopupShell>
  );
};

/* =========================================================
   3. STOCK ADJUSTMENT POPUP
   ========================================================= */
export const StockAdjustmentPopup = ({ products, onSave, onClose }) => {
  const [productId, setProductId] = useState(String(products[0]?.id ?? ""));
  const [quantityAfter, setQuantityAfter] = useState("");
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0]);
  const [errors, setErrors] = useState({});
  const { submit, submitting, serverError } = useSubmit(onSave, onClose);

  // "Quantity before" is the system's current stock for the chosen product
  const product = findProduct(products, productId);
  const quantityBefore = product?.onHand ?? "";

  const clear = (key) => setErrors((prev) => ({ ...prev, [key]: "" }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};

    if (!product) next.productId = "Select a product.";

    if (!isWholeNumber(quantityAfter, 0)) {
      next.quantityAfter = `Enter the counted quantity (0 to ${MAX_QTY}).`;
    } else if (product && Number(quantityAfter) === product.onHand) {
      next.quantityAfter = "This is the same as the current stock. Nothing to adjust.";
    }

    if (!reason) next.reason = "Select a reason.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submit({
      productId: product.id,
      quantityBefore: Number(quantityBefore),
      quantityAfter: Number(quantityAfter),
      reason,
      date: todayISO(),
    });
  };

  return (
    <PopupShell title="Stock adjustment" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ProductSelect
          id="adjust-product"
          products={products}
          value={productId}
          onChange={(e) => { setProductId(e.target.value); clear("productId"); clear("quantityAfter"); }}
          error={errors.productId}
        />

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
              style={redBorder(Boolean(errors.quantityAfter))}
              value={quantityAfter}
              onChange={(e) => { setQuantityAfter(e.target.value); clear("quantityAfter"); }}
            />
            <FieldError message={errors.quantityAfter} />
          </div>
        </div>

        <div className="sp-field">
          <label htmlFor="adjust-reason">Reason</label>
          <select
            id="adjust-reason"
            className="sp-input sp-select"
            style={redBorder(Boolean(errors.reason))}
            value={reason}
            onChange={(e) => { setReason(e.target.value); clear("reason"); }}
          >
            {ADJUSTMENT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <FieldError message={errors.reason} />
        </div>

        <DateField id="adjust-date" />

        <FieldError message={serverError} />

        <PopupActions saveLabel="Save adjustment" onClose={onClose} submitting={submitting} />
      </form>
    </PopupShell>
  );
};