// src/components/Supplier/SupplierOrderPopups.jsx
// Popups for the supplier Orders page: Confirm order, Can't supply, and order Details
import { useState } from "react";
import { PopupShell } from "../Store Owner/StoreOwner_StockIn_popup";
import formatRand from "../../utils/formatRand";
import formatOrderDate from "../../utils/formatOrderDate";
import "../../Style/components/Supplier/SupplierOrderPopups.css";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const CANT_SUPPLY_REASONS = [
  "Out of stock",
  "Not enough stock for the full order",
  "Can't deliver by the date",
  "Can't deliver to these stores",
  "Other",
];

/* Shared: order summary shown on the Confirm and Details popups */
const OrderSummary = ({ order }) => (
  <>
    <span className="sop-chip">
      Accepted by {order.deliveries.length} of {plural(order.storesInRequest, "store")}
    </span>

    <dl className="sop-rows">
      <div><dt>Order</dt><dd>{order.id}</dd></div>
      <div><dt>Product</dt><dd>{order.product}</dd></div>
      <div><dt>Quantity accepted</dt><dd>{order.quantity} units</dd></div>
      <div><dt>Unit price</dt><dd>{formatRand(order.unitPrice)}</dd></div>
      <div><dt>Total</dt><dd>{formatRand(order.quantity * order.unitPrice)}</dd></div>
      <div><dt>Your minimum order</dt><dd>{order.minimumOrder} units</dd></div>
      <div><dt>Deliver by</dt><dd>{formatOrderDate(order.deliverBy)}</dd></div>
    </dl>

    <h3 className="sop-subtitle">Deliver to {plural(order.deliveries.length, "store")}</h3>
    <ul className="sop-stores">
      {order.deliveries.map((delivery) => (
        <li key={delivery.store}>
          <div>
            <strong>{delivery.store}</strong>
            <span>{delivery.address}</span>
          </div>
          <div className="sop-stores-amount">
            <strong>{delivery.units} units</strong>
            <span>{formatRand(delivery.units * order.unitPrice)}</span>
          </div>
        </li>
      ))}
    </ul>

    {order.notInOrder.map((item) => (
      <p key={item.store} className="sop-excluded">
        {item.store} ({item.units} units) has not accepted and is not part of this order.
      </p>
    ))}
  </>
);

/* Popup 1: Confirm order */
export const SupplierConfirmOrderPopup = ({ order, onClose, onConfirm, onCantSupply }) => {
  const [canSupply, setCanSupply] = useState(false);

  return (
    <PopupShell title="Confirm order" onClose={onClose}>
      <div className="sop">
        <OrderSummary order={order} />

        <label className="sop-check">
          <input
            type="checkbox"
            checked={canSupply}
            onChange={(e) => setCanSupply(e.target.checked)}
          />
          <span>I can supply this order in full by the date above.</span>
        </label>

        <p className="sop-note">Confirming tells the stores that this order is on its way.</p>

        <div className="sop-actions">
          <button
            type="button"
            className="sop-button sop-button-primary"
            disabled={!canSupply}
            onClick={onConfirm}
          >
            Confirm order
          </button>
          <button type="button" className="sop-button sop-button-outline" onClick={onCantSupply}>
            Can&apos;t supply
          </button>
        </div>
      </div>
    </PopupShell>
  );
};

/* Popup 2: Can't supply this order */
export const SupplierCantSupplyPopup = ({ onClose, onCancel, onDecline }) => {
  const [reason, setReason] = useState(CANT_SUPPLY_REASONS[0]);
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onDecline({ reason, note: note.trim() });
  };

  return (
    <PopupShell title="Can't supply this order" onClose={onClose}>
      <form className="sop" onSubmit={handleSubmit}>
        <p className="sop-intro">Tell the stores why, so they can find another supplier.</p>

        <div className="sp-field">
          <label htmlFor="sop-reason">Reason</label>
          <select
            id="sop-reason"
            className="sp-input sp-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          >
            {CANT_SUPPLY_REASONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="sp-field">
          <label htmlFor="sop-note">Note (optional)</label>
          <textarea
            id="sop-note"
            className="sp-input sop-textarea"
            rows={3}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <p className="sop-info">The stores will be told straight away.</p>

        <div className="sop-actions">
          <button type="submit" className="sop-button sop-button-danger">
            Decline order
          </button>
          <button type="button" className="sop-button sop-button-outline" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </PopupShell>
  );
};

/* Popup 3: Order details (View) */
export const SupplierOrderDetailsPopup = ({ order, onClose }) => (
  <PopupShell title="Details" onClose={onClose}>
    <div className="sop">
      <OrderSummary order={order} />
    </div>
  </PopupShell>
);
