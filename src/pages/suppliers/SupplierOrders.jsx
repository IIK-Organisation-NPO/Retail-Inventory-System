// src/pages/suppliers/SupplierOrders.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import {
  SupplierConfirmOrderPopup,
  SupplierCantSupplyPopup,
  SupplierOrderDetailsPopup,
} from "../../components/Supplier/SupplierOrderPopups";
import formatRand from "../../utils/formatRand";
import formatOrderDate from "../../utils/formatOrderDate";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/SupplierOrders.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "awaiting", label: "Awaiting confirmation" },
  { key: "confirmed", label: "Confirmed" },
];

const STATUS_LABELS = {
  awaiting: "Awaiting confirmation",
  confirmed: "Confirmed",
  declined: "Can't supply",
};

// Mock orders. Replace with data from the API.
const INITIAL_ORDERS = [
  {
    id: "ORD-001",
    product: "Ace Maize Meal 2.5kg",
    quantity: 70,
    unitPrice: 52,
    deliverBy: "2026-11-20",
    status: "awaiting",
    minimumOrder: 60,
    storesInRequest: 3,
    deliveries: [
      {
        store: "Mseleku Tuckshop",
        address: "Pietermaritzburg, Msunduzi, KwaZulu-Natal",
        contact: "Sipho Dlamini",
        phone: "082 000 0001",
        units: 50,
      },
      {
        store: "Edendale Spaza",
        address: "18 Main Road, Edendale, Pietermaritzburg, 3217",
        contact: "Thabo Mkhize",
        phone: "082 000 0003",
        units: 20,
      },
    ],
    notInOrder: [{ store: "Vusis Tuckshop", units: 30 }],
  },
  {
    id: "ORD-000",
    product: "Sprite 500ml",
    quantity: 24,
    unitPrice: 15,
    deliverBy: "2026-11-02",
    status: "confirmed",
    minimumOrder: 24,
    storesInRequest: 1,
    deliveries: [
      {
        store: "Mseleku Tuckshop",
        address: "Pietermaritzburg, Msunduzi, KwaZulu-Natal",
        contact: "Sipho Dlamini",
        phone: "082 000 0001",
        units: 24,
      },
    ],
    notInOrder: [],
  },
];

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const SupplierOrders = () => {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(INITIAL_ORDERS[0].id);
  // Which popup is open: { type: "confirm" | "cantSupply" | "details", orderId }
  const [popup, setPopup] = useState(null);

  const visibleOrders =
    activeFilter === "all" ? orders : orders.filter((order) => order.status === activeFilter);

  // Show the delivery list for the chosen order, or the first one in the current filter
  const selectedOrder =
    visibleOrders.find((order) => order.id === selectedId) ?? visibleOrders[0] ?? null;

  const popupOrder = popup ? orders.find((order) => order.id === popup.orderId) : null;

  const openPopup = (type, orderId) => {
    setSelectedId(orderId);
    setPopup({ type, orderId });
  };

  const closePopup = () => setPopup(null);

  const updateOrder = (id, changes) => {
    setOrders((items) => items.map((order) => (order.id === id ? { ...order, ...changes } : order)));
    setPopup(null);
  };

  const handleConfirm = () => {
    // TODO: tell the API the supplier confirmed this order
    updateOrder(popup.orderId, { status: "confirmed" });
  };

  const handleDecline = ({ reason, note }) => {
    // TODO: tell the API the supplier can't supply this order, with the reason and note
    updateOrder(popup.orderId, { status: "declined", declineReason: reason, declineNote: note });
  };

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar />

      <main className="supplier-dashboard-main supplier-orders">
        <header className="supplier-dashboard-header">
          <h1>Orders</h1>
          <div className="supplier-dashboard-account">
            <Link
              to="/supplier/company-profile"
              className="supplier-company-pill"
              aria-label="Tiger Brands Ltd company profile"
            >
              <span className="supplier-company-initials" aria-hidden="true">TB</span>
              <span>Tiger Brands Ltd</span>
            </Link>
            <SupplierUserMenu />
          </div>
        </header>

        <div className="supplier-orders-filters" role="tablist" aria-label="Filter orders">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.key}
              className={`supplier-orders-filter${activeFilter === filter.key ? " active" : ""}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <section className="supplier-dashboard-panel supplier-orders-panel" aria-labelledby="supplier-orders-title">
          <h2 id="supplier-orders-title">Orders from accepted quotations</h2>

          {visibleOrders.length === 0 ? (
            <p className="supplier-orders-empty">No orders here yet.</p>
          ) : (
            <div className="supplier-dashboard-table-wrap">
              <table className="supplier-dashboard-table supplier-orders-list">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Product</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Unit price</th>
                    <th scope="col">Total</th>
                    <th scope="col">Deliver by</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="supplier-visually-hidden">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className={order.id === selectedOrder?.id ? "selected" : ""}>
                      <td>{order.id}</td>
                      <td>{order.product}</td>
                      <td>{order.quantity}</td>
                      <td>{formatRand(order.unitPrice)}</td>
                      <td>{formatRand(order.quantity * order.unitPrice)}</td>
                      <td>{formatOrderDate(order.deliverBy, false)}</td>
                      <td>
                        <span className={`supplier-dashboard-status supplier-orders-status ${order.status}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="supplier-orders-action">
                        {order.status === "awaiting" ? (
                          <button
                            type="button"
                            className="supplier-orders-confirm-button"
                            onClick={() => openPopup("confirm", order.id)}
                          >
                            Confirm order
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="supplier-orders-link"
                            onClick={() => openPopup("details", order.id)}
                            aria-label={`View details for ${order.id}`}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedOrder && (
          <>
            <p className="supplier-orders-summary">
              <span className="supplier-orders-summary-chip">
                {selectedOrder.id}: accepted by {selectedOrder.deliveries.length} of{" "}
                {plural(selectedOrder.storesInRequest, "store")}
              </span>
              <span>
                Your minimum order is {selectedOrder.minimumOrder} units. {selectedOrder.quantity} units were
                accepted
                {selectedOrder.quantity >= selectedOrder.minimumOrder
                  ? ", so the order can go ahead."
                  : ", which is below your minimum."}
              </span>
            </p>

            <section
              className="supplier-dashboard-panel supplier-orders-delivery"
              aria-labelledby="supplier-delivery-title"
            >
              <div className="supplier-dashboard-panel-header">
                <h2 id="supplier-delivery-title">
                  Delivery list for {selectedOrder.id}: {selectedOrder.product}
                </h2>
                <button type="button" className="supplier-orders-link" onClick={() => window.print()}>
                  Print list
                </button>
              </div>

              <div className="supplier-dashboard-table-wrap">
                <table className="supplier-dashboard-table supplier-orders-delivery-table">
                  <thead>
                    <tr>
                      <th scope="col">Store</th>
                      <th scope="col">Address</th>
                      <th scope="col">Contact person</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Units</th>
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.deliveries.map((delivery) => (
                      <tr key={delivery.store}>
                        <td>{delivery.store}</td>
                        <td>{delivery.address}</td>
                        <td>{delivery.contact}</td>
                        <td>{delivery.phone}</td>
                        <td>{delivery.units}</td>
                        <td>{formatRand(delivery.units * selectedOrder.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={4}>Total</th>
                      <td>{selectedOrder.quantity}</td>
                      <td>{formatRand(selectedOrder.quantity * selectedOrder.unitPrice)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedOrder.notInOrder.length > 0 && (
                <p className="supplier-orders-excluded">
                  <strong>Not in this order:</strong>{" "}
                  {selectedOrder.notInOrder.map((item) => `${item.store}, ${item.units} units`).join("; ")}.{" "}
                  {selectedOrder.notInOrder.length === 1
                    ? "This store has not accepted your quotation."
                    : "These stores have not accepted your quotation."}
                </p>
              )}
            </section>
          </>
        )}

        <p className="supplier-orders-notice">
          You can see the store names and addresses because these stores accepted your quotation.
        </p>
        <p className="supplier-orders-footnote">
          Confirm each order to show you can supply it. If you cannot, choose Can&apos;t supply on the
          confirmation card.
        </p>
      </main>

      {popupOrder && popup.type === "confirm" && (
        <SupplierConfirmOrderPopup
          order={popupOrder}
          onClose={closePopup}
          onConfirm={handleConfirm}
          onCantSupply={() => setPopup({ type: "cantSupply", orderId: popupOrder.id })}
        />
      )}

      {popupOrder && popup.type === "cantSupply" && (
        <SupplierCantSupplyPopup
          onClose={closePopup}
          onCancel={() => setPopup({ type: "confirm", orderId: popupOrder.id })}
          onDecline={handleDecline}
        />
      )}

      {popupOrder && popup.type === "details" && (
        <SupplierOrderDetailsPopup order={popupOrder} onClose={closePopup} />
      )}
    </div>
  );
};

export default SupplierOrders;
