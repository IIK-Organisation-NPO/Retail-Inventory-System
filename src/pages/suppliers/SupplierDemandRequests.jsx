import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import "../../Style/components/Supplier/SupplierDemandRequests.css";

const DEMAND_REQUESTS = [
  {
    id: "coca-cola-500",
    product: "Coca-Cola 500ml",
    category: "Groceries",
    units: 72,
    demand: "72 units",
    stores: 2,
    closes: "Sun 22 Nov",
    closesOn: "2026-11-22",
    area: "Msunduzi",
    status: "New",
  },
  {
    id: "ace-maize-meal-25",
    product: "Ace Maize Meal 2.5kg",
    category: "Drinks",
    units: 100,
    demand: "100 units",
    stores: 3,
    closes: "Fri 20 Nov",
    closesOn: "2026-11-20",
    area: "Mkhambathini",
    status: "Quote submitted",
    quote: {
      unitPrice: "52.00",
      quantity: "100",
      minimumOrder: "30",
      deliveryDate: "2026-11-27",
    },
  },
  {
    id: "sunflower-oil-5l",
    product: "Sunflower oil 5L",
    category: "Groceries",
    units: 60,
    demand: "60 L",
    stores: 4,
    closes: "Wed 25 Nov",
    closesOn: "2026-11-25",
    area: "uMngeni",
    status: "New",
  },
];

const INITIAL_QUOTE = {
  unitPrice: "18.50",
  quantity: "72",
  deliveryDate: "2026-11-27",
  minimumOrder: "30",
  notes: "",
  confirmed: true,
};

const formatRand = (value) => `R${Number(value).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const SupplierDemandRequests = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All my categories");
  const [sortOrder, setSortOrder] = useState("Closing soonest");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRequest = DEMAND_REQUESTS.find((request) => request.id === searchParams.get("request")) ?? null;
  const [quoteForm, setQuoteForm] = useState(INITIAL_QUOTE);
  const [submittedQuotes, setSubmittedQuotes] = useState(
    Object.fromEntries(DEMAND_REQUESTS.filter((request) => request.quote).map((request) => [request.id, request.quote]))
  );
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showSubmissionConfirmation, setShowSubmissionConfirmation] = useState(false);

  const visibleRequests = DEMAND_REQUESTS
    .filter((request) => {
      const currentStatus = submittedQuotes[request.id] ? "Quote submitted" : "New";
      return statusFilter === "All" || currentStatus === statusFilter;
    })
    .filter((request) => categoryFilter === "All my categories" || request.category === categoryFilter)
    .slice()
    .sort((left, right) => {
      if (sortOrder === "Highest demand") return right.units - left.units;
      return DEMAND_REQUESTS.findIndex((request) => request.id === left.id) -
        DEMAND_REQUESTS.findIndex((request) => request.id === right.id);
    });

  const openRequest = (request) => {
    setSearchParams({ request: request.id });
    setShowSubmissionConfirmation(false);
  };

  const openQuotationForm = () => {
    setQuoteForm({
      ...INITIAL_QUOTE,
      quantity: String(selectedRequest.units),
    });
    setShowSubmissionConfirmation(false);
    setIsQuoteModalOpen(true);
  };

  const closeQuotationModal = () => {
    setIsQuoteModalOpen(false);
    setShowSubmissionConfirmation(false);
  };

  const returnToRequests = () => {
    closeQuotationModal();
    setSearchParams({}, { replace: true });
  };

  const handleQuoteSubmit = (event) => {
    event.preventDefault();
    const submittedQuote = { ...quoteForm };
    setSubmittedQuotes((current) => ({ ...current, [selectedRequest.id]: submittedQuote }));
    setShowSubmissionConfirmation(true);
  };

  const updateQuoteField = (field, value) => {
    setQuoteForm((current) => ({ ...current, [field]: value }));
  };

  const quotedDetails = selectedRequest ? submittedQuotes[selectedRequest.id] : null;
  const totalIfAccepted = selectedRequest
    ? formatRand(Number(quoteForm.unitPrice || 0) * selectedRequest.units)
    : "";

  return (
    <div className="supplier-demand-layout">
      <SupplierSidebar showActivityBadges />

      <main className="supplier-demand-main">
        <header className="supplier-demand-header">
          <h1>{selectedRequest ? selectedRequest.product : "Demand requests"}</h1>
          <div className="supplier-demand-account">
            <Link
              to="/supplier/company-profile"
              className="supplier-demand-company-pill"
              aria-label="Tiger Brands Ltd company profile"
            >
              <span className="supplier-demand-company-initials" aria-hidden="true">TB</span>
              <span>Tiger Brands Ltd</span>
            </Link>
            <SupplierUserMenu />
          </div>
        </header>

        {selectedRequest ? (
          <section className="supplier-request-detail" aria-label={`${selectedRequest.product} demand details`}>
            <button
              type="button"
              className="supplier-demand-back-link"
              onClick={() => setSearchParams({}, { replace: true })}
            >
              ← Back to demand requests
            </button>

            <div className="supplier-request-stats">
              <article><span>Combined demand</span><strong>{selectedRequest.demand}</strong></article>
              <article><span>Stores</span><strong>{selectedRequest.stores}</strong></article>
              <article><span>Quotes close</span><strong>{selectedRequest.closes}</strong></article>
              <article><span>Delivery area</span><strong>{selectedRequest.area}</strong></article>
            </div>

            <div className="supplier-request-detail-panels">
              <section className="supplier-demand-card">
                <h2>Demand by area</h2>
                <table className="supplier-demand-table">
                  <thead>
                    <tr><th scope="col">Area</th><th scope="col">Stores</th><th scope="col">Units</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedRequest.area}, KwaZulu-Natal</td>
                      <td>{selectedRequest.stores}</td>
                      <td>{selectedRequest.units}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="supplier-demand-card supplier-your-quotation">
                <h2>Your quotation</h2>
                {quotedDetails ? (
                  <>
                    <p>Your quotation has been submitted for this request.</p>
                    <dl className="supplier-quote-summary">
                      <div><dt>Unit price</dt><dd>{formatRand(quotedDetails.unitPrice)}</dd></div>
                      <div><dt>Quantity</dt><dd>{quotedDetails.quantity}</dd></div>
                      <div><dt>Status</dt><dd>Quote submitted</dd></div>
                    </dl>
                  </>
                ) : (
                  <>
                    <p>You have not quoted on this request yet.</p>
                    <button type="button" className="supplier-demand-primary-button" onClick={openQuotationForm}>
                      Submit quotation
                    </button>
                    <div className="supplier-quote-privacy-note">
                      Quotes from other suppliers are not shown to you.
                    </div>
                  </>
                )}
              </section>
            </div>
          </section>
        ) : (
          <section className="supplier-demand-list" aria-label="Supplier demand requests">
            <div className="supplier-demand-filters" role="group" aria-label="Filter by quote status">
              {["All", "New", "Quote submitted"].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={`supplier-demand-filter${statusFilter === filter ? " active" : ""}`}
                  aria-pressed={statusFilter === filter}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="supplier-demand-selectors">
              <label>
                <span className="supplier-visually-hidden">Product category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option>All my categories</option>
                  <option>Groceries</option>
                  <option>Drinks</option>
                </select>
              </label>
              <label>
                <span className="supplier-visually-hidden">Sort demand requests</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option>Closing soonest</option>
                  <option>Highest demand</option>
                </select>
              </label>
            </div>

            <section className="supplier-demand-card supplier-demand-list-card">
              <h2>Combined demand from stores</h2>
              <div className="supplier-demand-table-scroll">
                <table className="supplier-demand-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Category</th>
                      <th scope="col">Combined demand</th>
                      <th scope="col">Stores</th>
                      <th scope="col">Closes</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="supplier-visually-hidden">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRequests.map((request) => {
                      const hasQuote = Boolean(submittedQuotes[request.id]);
                      return (
                        <tr key={request.id}>
                          <td>{request.product}</td>
                          <td>{request.category}</td>
                          <td>{request.demand}</td>
                          <td>{request.stores}</td>
                          <td>{request.closes}</td>
                          <td>
                            <span className={`supplier-demand-status${hasQuote ? "" : " new"}`}>
                              {hasQuote ? "Quote submitted" : "New"}
                            </span>
                          </td>
                          <td>
                            <button type="button" className="supplier-demand-text-action" onClick={() => openRequest(request)}>
                              {hasQuote ? "View" : "View and quote"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleRequests.length === 0 && (
                      <tr><td className="supplier-demand-empty" colSpan="7">No requests match these filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="supplier-demand-footnote">
              Requests from many stores are added together, so you quote once for the whole amount.
            </p>
          </section>
        )}
      </main>

      {isQuoteModalOpen && selectedRequest && (
        <div className="supplier-demand-modal-backdrop">
          <section
            className="supplier-demand-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-demand-modal-title"
          >
            <header className="supplier-demand-modal-header">
              <h2 id="supplier-demand-modal-title">
                {showSubmissionConfirmation ? "Quotation submitted" : "Submit quotation"}
              </h2>
              <button type="button" className="supplier-demand-modal-close" onClick={closeQuotationModal} aria-label="Close">
                ×
              </button>
            </header>

            {showSubmissionConfirmation ? (
              <div className="supplier-quotation-success">
                <p>Each store will see its own share of your quotation. You will be told when stores accept.</p>
                <dl className="supplier-quote-summary">
                  <div><dt>Product</dt><dd>{selectedRequest.product}</dd></div>
                  <div><dt>Unit price</dt><dd>{formatRand(quoteForm.unitPrice)}</dd></div>
                  <div><dt>Quantity</dt><dd>{quoteForm.quantity}</dd></div>
                  <div><dt>Minimum order</dt><dd>{quoteForm.minimumOrder} units</dd></div>
                  <div><dt>Total if all accepted</dt><dd>{totalIfAccepted}</dd></div>
                  <div>
                    <dt>Delivery date</dt>
                    <dd>{new Date(`${quoteForm.deliveryDate}T00:00:00`).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}</dd>
                  </div>
                </dl>
                <span className="supplier-demand-status">Submitted</span>
                <button type="button" className="supplier-demand-primary-button" onClick={returnToRequests}>
                  Back to demand requests
                </button>
              </div>
            ) : (
              <form className="supplier-quotation-form" onSubmit={handleQuoteSubmit}>
                <div className="supplier-quotation-product">
                  <strong>{selectedRequest.product}</strong>
                  <span>Combined demand: {selectedRequest.demand}</span>
                </div>

                <div className="supplier-quotation-fields">
                  <label>
                    Unit price (R) *
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quoteForm.unitPrice}
                      onChange={(event) => updateQuoteField("unitPrice", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Quantity you can supply *
                    <input
                      type="number"
                      min="1"
                      max={selectedRequest.units}
                      step="1"
                      value={quoteForm.quantity}
                      onChange={(event) => updateQuoteField("quantity", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Delivery date *
                    <input
                      type="date"
                      min="2026-11-23"
                      value={quoteForm.deliveryDate}
                      onChange={(event) => updateQuoteField("deliveryDate", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Minimum order quantity *
                    <input
                      type="number"
                      min="1"
                      max={quoteForm.quantity || selectedRequest.units}
                      step="1"
                      value={quoteForm.minimumOrder}
                      onChange={(event) => updateQuoteField("minimumOrder", event.target.value)}
                      required
                    />
                  </label>
                </div>

                <p className="supplier-quotation-help">
                  The order goes ahead only if stores accept at least this many units.
                </p>

                <label className="supplier-quotation-notes">
                  Notes (optional)
                  <textarea
                    rows="3"
                    value={quoteForm.notes}
                    onChange={(event) => updateQuoteField("notes", event.target.value)}
                  />
                </label>

                <label className="supplier-quotation-confirm">
                  <input
                    type="checkbox"
                    checked={quoteForm.confirmed}
                    onChange={(event) => updateQuoteField("confirmed", event.target.checked)}
                    required
                  />
                  <span>I confirm I can supply this quantity by the delivery date.</span>
                </label>

                <p className="supplier-quotation-total">
                  <strong>Total if all {selectedRequest.units} units are accepted</strong>
                  <strong>{totalIfAccepted}</strong>
                </p>

                <div className="supplier-quotation-actions">
                  <button type="submit" className="supplier-demand-primary-button">
                    Submit quotation
                  </button>
                  <button type="button" className="supplier-demand-secondary-button" onClick={closeQuotationModal}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SupplierDemandRequests;
