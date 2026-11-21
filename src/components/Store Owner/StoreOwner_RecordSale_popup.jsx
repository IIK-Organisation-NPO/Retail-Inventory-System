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

// Round to whole cents to avoid floating point drift (e.g. 0.1 + 0.2)
const roundMoney = (amount) => Math.round(amount * 100) / 100;

/**
 * products:   [{ id, product, price, onHand, barcode }]
 * onComplete: called with { items, payment, total, received, change }
 */
const StoreOwner_RecordSale_popup = ({ products, onComplete, onClose }) => {
  const [query, setQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lines, setLines] = useState([]); // items in this sale
  const [showOtherItem, setShowOtherItem] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [received, setReceived] = useState("");
  const [error, setError] = useState("");
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
  const receivedAmount = Number(received);
  const change = received !== "" && receivedAmount >= total ? roundMoney(receivedAmount - total) : null;

  /* ---------- Items ---------- */
  const addProduct = (product) => {
    if (qtyInSale(product.id) >= product.onHand) {
      setError(`No more ${product.product} in stock.`);
      return;
    }
    setError("");
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
      setError(`Only ${product.onHand} of ${product.product} in stock.`);
      return;
    }
    setError("");
    setLines((current) => current.map((l) => (l.key === line.key ? { ...l, qty: nextQty } : l)));
  };

  const removeLine = (key) => {
    setLines((current) => current.filter((line) => line.key !== key));
  };

  // An item that isn't in the product list (e.g. loose sweets)
  const addOtherItem = () => {
    const amount = Number(otherAmount);
    if (otherAmount === "" || Number.isNaN(amount) || amount <= 0) {
      setError("Enter an amount for the additional item.");
      return;
    }
    setError("");
    setLines((current) => [
      ...current,
      {
        key: `o-${Date.now()}`,
        productId: null,
        name: otherName.trim() || "Additional item",
        price: roundMoney(amount),
        qty: 1,
      },
    ]);
    setOtherName("");
    setOtherAmount("");
    setShowOtherItem(false);
  };

  /* ---------- Search box ---------- */
  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Barcode scanners type the code and press Enter
    const byBarcode = products.find((p) => p.barcode === query.trim());
    if (byBarcode) addProduct(byBarcode);
    else if (matches.length === 1) addProduct(matches[0]);
    else if (query.trim()) setError("No product matches that barcode or name.");
  };

  /* ---------- Scan barcode popup ---------- */
  const openScanner = () => {
    setError("");
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
    setShowScanner(false);
  };

  /* ---------- Complete ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Add at least one item to the sale.");
      return;
    }
    if (payment === "Cash" && (received === "" || Number.isNaN(receivedAmount) || receivedAmount < total)) {
      setError(`Amount received must be at least ${formatRand(total)}.`);
      return;
    }

    // Pass the data back to the parent (StoreOwner_Sales.jsx) which sends it to the backend
    onComplete?.({
      items: lines.map(({ productId, name, price, qty }) => ({ productId, name, price, qty })),
      payment,
      total,
      received: payment === "Cash" ? receivedAmount : total,
      change: payment === "Cash" ? change : 0,
    });
    onClose();
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
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError("");
              }}
              onKeyDown={handleSearchKeyDown}
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="sp-btn sp-btn-outline rs-scan-btn"
              onClick={openScanner}
            >
              Scan barcode
            </button>
          </div>

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
            <p className="rs-no-results">No products match “{query.trim()}”.</p>
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
                  <span className="rs-line-meta">
                    {line.productId ? `${formatRand(line.price)} each` : "Included in sale"}
                  </span>
                </div>

                {line.productId && (
                  <div className="rs-stepper" aria-label={`Quantity of ${line.name}`}>
                    <button type="button" onClick={() => changeQty(line, -1)} aria-label="Decrease quantity">−</button>
                    <span className="rs-qty">{line.qty}</span>
                    <button type="button" onClick={() => changeQty(line, 1)} aria-label="Increase quantity">+</button>
                  </div>
                )}

                <span className="rs-line-total">{formatRand(line.price * line.qty)}</span>
                <button type="button" className="rs-remove" onClick={() => removeLine(line.key)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Additional item not in the product list */}
        {showOtherItem ? (
          <div className="rs-other">
            <input
              type="text"
              className="sp-input"
              placeholder="Description (optional)"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              aria-label="Additional item description"
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="sp-input rs-other-amount"
              placeholder="Amount (R)"
              value={otherAmount}
              onChange={(e) => setOtherAmount(e.target.value)}
              aria-label="Additional item amount in rand"
            />
            <button type="button" className="sp-btn sp-btn-primary" onClick={addOtherItem}>Add</button>
          </div>
        ) : (
          <button type="button" className="rs-link-btn" onClick={() => setShowOtherItem(true)}>
            + Add an item not in the list
          </button>
        )}

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
              onClick={() => {
                setPayment(method);
                setError("");
              }}
            >
              {method}
            </button>
          ))}
        </div>

        {payment === "Cash" && (
          <div className="sp-row">
            <div className="sp-field">
              <label htmlFor="rs-received">Amount received (R)</label>
              <input
                id="rs-received"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="sp-input"
                value={received}
                onChange={(e) => {
                  setReceived(e.target.value);
                  setError("");
                }}
              />
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
        )}

        {/* =========================================
            TOTAL
            ========================================= */}
        <div className="rs-total">
          <span>Total</span>
          <span>{formatRand(total)}</span>
        </div>

        <p className="rs-note">Stock goes down automatically when you complete the sale.</p>

        {error && <p className="sp-error">{error}</p>}

        <div className="sp-actions">
          <button type="submit" className="sp-btn sp-btn-primary">Complete sale</button>
          <button type="button" className="sp-btn sp-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </PopupShell>
  );
};

export default StoreOwner_RecordSale_popup;