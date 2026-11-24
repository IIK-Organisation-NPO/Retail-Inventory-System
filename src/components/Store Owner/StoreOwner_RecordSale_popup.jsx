// src/components/Store Owner/StoreOwner_RecordSale_popup.jsx
// "Record sale" popup: search or scan products, set quantities, take payment
import { useRef, useState } from "react";
import { PopupShell } from "./StoreOwner_StockIn_popup";
import StoreOwner_ScanBarcode_popup from "./StoreOwner_ScanBarcode_popup";
import formatRand from "../../utils/formatRand";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";
import "../../Style/Store Owner/StoreOwner_RecordSale_popup.css";

const MAX_RESULTS = 5;
const PAYMENT_METHODS = ["Cash", "Card"];

// Validation messages: red, directly under the field they belong to
const ERROR_COLOR = "#c62828";
const errorStyle = { color: ERROR_COLOR, fontSize: "0.85rem", margin: "6px 0 0" };
const redBorder = (invalid) => (invalid ? { borderColor: ERROR_COLOR } : undefined);

const FieldError = ({ message }) =>
  message ? (
    <p role="alert" style={errorStyle}>
      {message}
    </p>
  ) : null;

// Round to whole cents to avoid floating point drift (e.g. 0.1 + 0.2)
const roundMoney = (amount) => Math.round(amount * 100) / 100;
const toCents = (amount) => Math.round(Number(amount) * 100);

/**
 * products:   [{ id, product, price, onHand, barcode }]
 * onComplete: async, called with { items, payment, total, amountPaid, change }.
 *             It throws if the server rejects the sale.
 */
const StoreOwner_RecordSale_popup = ({ products, onComplete, onClose }) => {
  const [query, setQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lines, setLines] = useState([]); // items in this sale
  const [payment, setPayment] = useState("Cash");
  // Cash: the amount received. Card: the amount charged on the speed point.
  const [amountPaid, setAmountPaid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // One message per place on the form
  const [searchError, setSearchError] = useState(""); // under the search box
  const [itemsError, setItemsError] = useState(""); // under the items list
  const [amountError, setAmountError] = useState(""); // under the amount field
  const [formError, setFormError] = useState(""); // above the buttons

  const searchRef = useRef(null);

  // How many of a product are already in this sale
  const qtyInSale = (productId) =>
    lines.find((line) => line.productId === productId)?.qty ?? 0;

  // Search by name, or by exact barcode
  const search = query.trim().toLowerCase();
  const matches = search
    ? products
        .filter((p) => p.product.toLowerCase().includes(search) || p.barcode === search)
        .slice(0, MAX_RESULTS)
    : [];

  const total = roundMoney(lines.reduce((sum, line) => sum + line.price * line.qty, 0));
  const paidAmount = Number(amountPaid);
  const change =
    payment === "Cash" && amountPaid !== "" && paidAmount >= total
      ? roundMoney(paidAmount - total)
      : null;

  /* ---------- Items ---------- */
  const addProduct = (product) => {
    if (qtyInSale(product.id) >= product.onHand) {
      setSearchError(`No more ${product.product} in stock.`);
      return;
    }
    setSearchError("");
    setItemsError("");
    setFormError("");
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [
        ...current,
        { key: `p-${product.id}`, productId: product.id, name: product.product, price: product.price, qty: 1 },
      ];
    });
    setQuery("");
    searchRef.current?.focus();
  };

  const changeQty = (line, delta) => {
    const product = products.find((p) => p.id === line.productId);
    const nextQty = line.qty + delta;
    if (nextQty < 1) return;
    if (product && nextQty > product.onHand) {
      setItemsError(`Only ${product.onHand} of ${product.product} in stock.`);
      return;
    }
    setItemsError("");
    setFormError("");
    setLines((current) => current.map((l) => (l.key === line.key ? { ...l, qty: nextQty } : l)));
  };

  const removeLine = (key) => {
    setItemsError("");
    setLines((current) => current.filter((line) => line.key !== key));
  };

  /* ---------- Search box ---------- */
  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Barcode scanners type the code and press Enter
    const byBarcode = products.find((p) => p.barcode === query.trim());
    if (byBarcode) addProduct(byBarcode);
    else if (matches.length === 1) addProduct(matches[0]);
    else if (query.trim()) setSearchError("No product matches that barcode or name.");
  };

  /* ---------- Scan barcode popup ---------- */
  const openScanner = () => {
    setSearchError("");
    setShowScanner(true);
  };

  // Merge the scanned items into the items in this sale
  const addScannedItems = (scannedItems) => {
    setLines((current) => {
      const next = [...current];
      scannedItems.forEach(({ productId, qty }) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        const index = next.findIndex((line) => line.productId === productId);
        if (index >= 0) {
          next[index] = { ...next[index], qty: next[index].qty + qty };
        } else {
          next.push({ key: `p-${productId}`, productId, name: product.product, price: product.price, qty });
        }
      });
      return next;
    });
    setItemsError("");
    setFormError("");
    setShowScanner(false);
  };

  /* ---------- Payment ---------- */
  const choosePayment = (method) => {
    setPayment(method);
    setAmountPaid(""); // the field means something different for each method
    setAmountError("");
    setFormError("");
  };

  // Returns an error message, or "" if the amount is fine
  const checkAmount = () => {
    if (amountPaid.trim() === "" || Number.isNaN(paidAmount) || paidAmount <= 0) {
      return payment === "Card"
        ? "Enter the amount charged on the speed point."
        : "Enter the amount received.";
    }
    if (Math.abs(paidAmount * 100 - Math.round(paidAmount * 100)) > 1e-6) {
      return "The amount can have at most 2 decimal places.";
    }
    if (lines.length > 0) {
      if (payment === "Cash" && toCents(paidAmount) < toCents(total)) {
        return `Amount received must be at least ${formatRand(total)}.`;
      }
      if (payment === "Card" && toCents(paidAmount) !== toCents(total)) {
        return `The card amount must match the sale total of ${formatRand(total)}.`;
      }
    }
    return "";
  };

  /* ---------- Complete ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Check everything at once so every problem shows under its own field
    let itemsMessage = "";
    if (lines.length === 0) {
      itemsMessage = "Add at least one item to the sale.";
    } else {
      const tooMany = lines.find((line) => {
        const product = products.find((p) => p.id === line.productId);
        return product && line.qty > product.onHand;
      });
      if (tooMany) itemsMessage = `Only ${products.find((p) => p.id === tooMany.productId).onHand} of ${tooMany.name} in stock.`;
    }
    const amountMessage = checkAmount();

    setItemsError(itemsMessage);
    setAmountError(amountMessage);
    setFormError("");
    if (itemsMessage || amountMessage) return;

    setSubmitting(true);
    try {
      // The parent (StoreOwner_Sales.jsx) sends this to the backend and throws if it fails
      await onComplete?.({
        items: lines.map(({ productId, name, price, qty }) => ({ productId, name, price, qty })),
        payment,
        total,
        amountPaid: roundMoney(paidAmount),
        change: payment === "Cash" ? roundMoney(paidAmount - total) : 0,
      });
      onClose();
    } catch (err) {
      const fieldErrors = err.fieldErrors || {};
      if (fieldErrors.amountPaid) setAmountError(fieldErrors.amountPaid);
      else if (fieldErrors.items || err.status === 404 || err.status === 409)
        setItemsError(fieldErrors.items || err.message); // e.g. not enough stock
      else setFormError(err.message || "Could not record the sale. Please try again.");
      setSubmitting(false);
    }
  };

  // While scanning, hide this popup and show the Scan barcode popup instead.
  // This component stays mounted, so the items already added are kept.
  if (showScanner) {
    return (
      <StoreOwner_ScanBarcode_popup
        products={products}
        qtyInSale={qtyInSale}
        onDone={addScannedItems}
        onCancel={() => setShowScanner(false)}
      />
    );
  }

  return (
    <PopupShell title="Record sale" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {/* =========================================
            SEARCH / SCAN
            ========================================= */}
        <div className="sp-field rs-search-field">
          <label htmlFor="rs-search">Search product by name</label>
          <div className="rs-search-row">
            <input
              id="rs-search"
              ref={searchRef}
              type="text"
              className="sp-input"
              style={redBorder(Boolean(searchError))}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchError("");
              }}
              onKeyDown={handleSearchKeyDown}
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="sp-btn sp-btn-outline rs-scan-btn"
              onClick={openScanner}
              disabled={submitting}
            >
              Scan barcode
            </button>
          </div>
          <FieldError message={searchError} />

          {/* Search results */}
          {matches.length > 0 && (
            <ul className="rs-results">
              {matches.map((p) => {
                const left = p.onHand - qtyInSale(p.id);
                return (
                  <li key={p.id} className="rs-result">
                    <div className="rs-result-info">
                      <span className="rs-result-name">{p.product}</span>
                      <span className="rs-result-meta">
                        {formatRand(p.price)} · {left} in stock
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rs-add-btn"
                      onClick={() => addProduct(p)}
                      disabled={left <= 0}
                    >
                      Add to sale
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {search && matches.length === 0 && (
            <FieldError message={`No products match “${query.trim()}”.`} />
          )}
        </div>

        {/* =========================================
            ITEMS IN THIS SALE
            ========================================= */}
        <p className="rs-section-label">Items in this sale</p>

        {lines.length === 0 ? (
          <p className="rs-empty">No items yet. Search or scan a product to add it.</p>
        ) : (
          <ul className="rs-lines">
            {lines.map((line) => (
              <li key={line.key} className="rs-line">
                <div className="rs-line-info">
                  <span className="rs-line-name">{line.name}</span>
                  <span className="rs-line-meta">{formatRand(line.price)} each</span>
                </div>

                <div className="rs-stepper" aria-label={`Quantity of ${line.name}`}>
                  <button type="button" onClick={() => changeQty(line, -1)} aria-label="Decrease quantity">−</button>
                  <span className="rs-qty">{line.qty}</span>
                  <button type="button" onClick={() => changeQty(line, 1)} aria-label="Increase quantity">+</button>
                </div>

                <span className="rs-line-total">{formatRand(line.price * line.qty)}</span>
                <button type="button" className="rs-remove" onClick={() => removeLine(line.key)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <FieldError message={itemsError} />

        {/* =========================================
            PAYMENT
            ========================================= */}
        <p className="rs-section-label">Payment method</p>
        <div className="rs-payment" role="radiogroup" aria-label="Payment method">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={payment === method}
              className={`sp-btn ${payment === method ? "sp-btn-primary" : "sp-btn-outline"}`}
              onClick={() => choosePayment(method)}
              disabled={submitting}
            >
              {method}
            </button>
          ))}
        </div>

        {payment === "Cash" ? (
          <div className="sp-row">
            <div className="sp-field">
              <label htmlFor="rs-paid">Amount received (R)</label>
              <input
                id="rs-paid"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="sp-input"
                style={redBorder(Boolean(amountError))}
                value={amountPaid}
                onChange={(e) => {
                  setAmountPaid(e.target.value);
                  setAmountError("");
                }}
              />
              <FieldError message={amountError} />
            </div>
            <div className="sp-field">
              <label htmlFor="rs-change">Change</label>
              <input
                id="rs-change"
                type="text"
                className="sp-input"
                value={change === null ? "" : formatRand(change)}
                readOnly
                tabIndex={-1}
              />
            </div>
          </div>
        ) : (
          // Card: one field for the amount on the speed point, and no change
          <div className="sp-field">
            <label htmlFor="rs-paid">Amount on the speed point (R)</label>
            <input
              id="rs-paid"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="sp-input"
              style={redBorder(Boolean(amountError))}
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value);
                setAmountError("");
              }}
            />
            <FieldError message={amountError} />
            {!amountError && (
              <p className="rs-note">Type the amount charged on the card machine. It must match the total.</p>
            )}
          </div>
        )}

        {/* =========================================
            TOTAL
            ========================================= */}
        <div className="rs-total">
          <span>Total</span>
          <span>{formatRand(total)}</span>
        </div>

        <p className="rs-note">Stock goes down automatically when you complete the sale.</p>

        <FieldError message={formError} />

        <div className="sp-actions">
          <button type="submit" className="sp-btn sp-btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : "Complete sale"}
          </button>
          <button type="button" className="sp-btn sp-btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </PopupShell>
  );
};

export default StoreOwner_RecordSale_popup;