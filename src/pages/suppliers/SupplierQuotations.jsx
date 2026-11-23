import { useState } from "react";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierAccountInitials from "../../components/Supplier/SupplierAccountInitials";
import "../../Style/components/Supplier/SupplierQuotations.css";

const QUOTATIONS = [
  { id: "Q-003", product: "Ace Maize Meal 2.5kg", unitPrice: "R52.00", quantity: 100, delivery: "20 Nov", status: "Accepted" },
  { id: "Q-002", product: "Fanta Orange 500ml", unitPrice: "R14.50", quantity: 48, delivery: "06 Nov", status: "Declined" },
  { id: "Q-001", product: "Sprite 500ml", unitPrice: "R15.00", quantity: 24, delivery: "30 Oct", status: "Declined" },
];

const FILTERS = ["All", "Submitted", "Accepted", "Declined"];

const SupplierQuotations = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const visibleQuotes = QUOTATIONS.filter((quote) => (
    activeFilter === "All" || quote.status === activeFilter
  ));

  return (
    <div className="supplier-quotations-layout">
      <SupplierSidebar showActivityBadges />
      <main className="supplier-quotations-main">
        <header className="supplier-quotations-header">
          <h1>My quotations</h1>
          <div className="supplier-quotations-account">
            <div className="supplier-quotations-company-pill">
              <span className="supplier-quotations-company-initials">TB</span>
              <span>Tiger Brands Ltd</span>
            </div>
            <SupplierAccountInitials />
          </div>
        </header>

        <div className="supplier-quotations-filters" role="group" aria-label="Filter quotations">
          {FILTERS.map((filter) => (
            <button
              type="button"
              key={filter}
              className={`supplier-quotations-filter${activeFilter === filter ? " active" : ""}`}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <section className="supplier-quotations-card" aria-labelledby="supplier-quotations-title">
          <h2 id="supplier-quotations-title">Quotations I have sent</h2>
          <div className="supplier-quotations-table-wrap">
            <table className="supplier-quotations-table">
              <thead>
                <tr>
                  <th scope="col">Quote</th>
                  <th scope="col">Product</th>
                  <th scope="col">Unit price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Delivery</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="supplier-quotations-visually-hidden">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>{quote.id}</td>
                    <td>{quote.product}</td>
                    <td>{quote.unitPrice}</td>
                    <td>{quote.quantity}</td>
                    <td>{quote.delivery}</td>
                    <td>
                      <span className={`supplier-quotation-status ${quote.status.toLowerCase()}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="supplier-quotation-view"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleQuotes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="supplier-quotations-empty">
                      No quotations match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedQuote && (
        <div className="supplier-quotations-modal-backdrop">
          <section className="supplier-quotations-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-quote-view-title">
            <header>
              <h2 id="supplier-quote-view-title">Quotation details</h2>
              <button type="button" aria-label="Close" onClick={() => setSelectedQuote(null)}>×</button>
            </header>
            <dl>
              <div><dt>Quote</dt><dd>{selectedQuote.id}</dd></div>
              <div><dt>Product</dt><dd>{selectedQuote.product}</dd></div>
              <div><dt>Unit price</dt><dd>{selectedQuote.unitPrice}</dd></div>
              <div><dt>Quantity</dt><dd>{selectedQuote.quantity}</dd></div>
              <div><dt>Delivery</dt><dd>{selectedQuote.delivery}</dd></div>
              <div><dt>Status</dt><dd>{selectedQuote.status}</dd></div>
            </dl>
            <button type="button" className="supplier-quotations-close-button" onClick={() => setSelectedQuote(null)}>
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default SupplierQuotations;
