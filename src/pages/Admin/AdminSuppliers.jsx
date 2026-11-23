import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../Style/Admin/AdminStores.css";
import "../../Style/Admin/AdminSuppliers.css";

const INITIAL_SUPPLIERS = [
  {
    id: "tiger-brands",
    name: "Tiger Brands Ltd",
    contactPerson: "Nandi Mokoena",
    categories: ["Groceries", "Drinks", "Snacks"],
    deliveryAreas: ["Durban", "Pietermaritzburg", "uMngeni"],
    deliveryAreasSummary: "3 areas",
    status: "Active",
    registrationNumber: "2005/012345/07",
    registeredName: "Tiger Brands Ltd",
    companyType: "Public Company",
    registered: "16 June 2005",
    cipcStatus: "In Business",
    website: "www.tigerbrands.com",
    mobile: "011 123 4567",
    email: "info@tigerbrands.example",
    registeredAddress: "1 Nollsworth Crescent, Durban, 4051",
    businessAddress: "Same as registered",
    postalAddress: "PO Box 123, Durban, 4000",
    history: [
      { title: "Approved", detail: "Supplier is active" },
      { title: "CIPC check", detail: "Found, In Business" },
    ],
  },
  {
    id: "pioneer-foods",
    name: "Pioneer Foods",
    contactPerson: "Sales desk",
    categories: ["Groceries"],
    deliveryAreas: ["Durban", "uMngeni"],
    deliveryAreasSummary: "2 areas",
    status: "Active",
    registrationNumber: "1997/098765/07",
    registeredName: "Pioneer Foods (Pty) Ltd",
    companyType: "Private Company",
    registered: "14 February 1997",
    cipcStatus: "In Business",
    website: "www.pioneerfoods.example",
    mobile: "021 765 4321",
    email: "sales@pioneerfoods.example",
    registeredAddress: "4 Main Road, Durban, 4001",
    businessAddress: "Same as registered",
    postalAddress: "PO Box 84, Durban, 4000",
    history: [
      { title: "Approved", detail: "Supplier is active" },
      { title: "CIPC check", detail: "Found, In Business" },
    ],
  },
  {
    id: "coastal-wholesale",
    name: "Coastal Wholesale (Pty) Ltd",
    contactPerson: "Pending contact",
    categories: ["Groceries", "Household"],
    deliveryAreas: ["Msunduzi", "uMngeni"],
    deliveryAreasSummary: "2 areas",
    status: "Pending approval",
    registrationNumber: "2021/654321/07",
    registeredName: "Coastal Wholesale (Pty) Ltd",
    companyType: "Private Company",
    registered: "04 June 2021",
    cipcStatus: "In Business",
    website: "Not provided",
    mobile: "031 000 0100",
    email: "info@coastal.example",
    registeredAddress: "1 Harbour Road, Durban, 4001",
    businessAddress: "Same as registered",
    postalAddress: "PO Box 22, Durban, 4000",
    history: [
      { title: "Submitted", detail: "13 Nov, 09:10 by the applicant" },
      { title: "CIPC check", detail: "Found, In Business" },
    ],
  },
];

const STATUS_OPTIONS = ["All statuses", "Active", "Pending approval", "Suspended", "Rejected"];
const CATEGORY_OPTIONS = ["All categories", "Groceries", "Drinks", "Snacks", "Household"];

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [dialog, setDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("Details do not match CIPC");
  const [rejectMessage, setRejectMessage] = useState("");
  const [suspendReason, setSuspendReason] = useState("Other");
  const [suspendNote, setSuspendNote] = useState("");

  const selectedSupplierId = searchParams.get("supplier");
  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = [supplier.name, supplier.registeredName, supplier.registrationNumber]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesCategory = category === "All categories" || supplier.categories.includes(category);
    const matchesStatus = status === "All statuses" || supplier.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openSupplier = (supplierId) => setSearchParams({ supplier: supplierId });
  const returnToList = () => setSearchParams({});

  const openDialog = (type, supplier) => {
    setDialog({ type, supplierId: supplier.id });
    setRejectReason("Details do not match CIPC");
    setRejectMessage("");
    setSuspendReason("Other");
    setSuspendNote("");
  };

  const closeDialog = () => setDialog(null);

  const updateSupplierStatus = (nextStatus, action, detail) => {
    if (!dialog) return;

    setSuppliers((currentSuppliers) => currentSuppliers.map((supplier) => (
      supplier.id === dialog.supplierId
        ? {
          ...supplier,
          status: nextStatus,
          history: [{ title: action, detail }, ...supplier.history],
        }
        : supplier
    )));
    closeDialog();
  };

  const exportSuppliers = () => {
    const headers = ["Company", "Contact person", "Categories", "Delivery areas", "Status", "CIPC number"];
    const rows = filteredSuppliers.map((supplier) => [
      supplier.name,
      supplier.contactPerson,
      supplier.categories.join(", "),
      supplier.deliveryAreas.join(", "),
      supplier.status,
      supplier.registrationNumber,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "suppliers.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const submitRejection = (event) => {
    event.preventDefault();
    const detail = rejectMessage.trim()
      ? `${rejectReason} — ${rejectMessage.trim()}`
      : rejectReason;
    updateSupplierStatus("Rejected", "Application rejected", detail);
  };

  const submitSuspension = (event) => {
    event.preventDefault();
    const detail = suspendNote.trim()
      ? `${suspendReason} — ${suspendNote.trim()}`
      : suspendReason;
    updateSupplierStatus("Suspended", "Supplier suspended", detail);
  };

  return (
    <div className="admin-stores-layout">
      <AdminSidebar />

      <main className="admin-stores-main">
        {selectedSupplier ? (
          <>
            <header className="admin-stores-header">
              <h1>{selectedSupplier.name}</h1>
              <span className="admin-stores-avatar" aria-label="Administrator">IA</span>
            </header>

            <button type="button" className="admin-stores-back admin-supplier-back" onClick={returnToList}>
              ← Back to suppliers
            </button>

            <div className="admin-store-detail-grid">
              <section className="admin-store-card">
                <h2>CIPC verification</h2>
                <p className="admin-store-card-subtitle">Read-only, from CIPC</p>
                <dl className="admin-store-fields">
                  <SupplierField label="Registration number" value={selectedSupplier.registrationNumber} />
                  <SupplierField label="Registered name" value={selectedSupplier.registeredName} />
                  <SupplierField label="Company type" value={selectedSupplier.companyType} />
                  <SupplierField label="Registered" value={selectedSupplier.registered} />
                  <SupplierField label="Status" value={selectedSupplier.cipcStatus} />
                </dl>
              </section>

              <section className="admin-store-card">
                <h2>Profile</h2>
                <p className="admin-store-card-subtitle">Provided by the applicant</p>
                <dl className="admin-store-fields">
                  <SupplierField label="Categories" value={selectedSupplier.categories.join(", ")} />
                  <SupplierField label="Delivery areas" value={selectedSupplier.deliveryAreas.join(", ")} />
                  <SupplierField label="Website" value={selectedSupplier.website} />
                </dl>
              </section>

              <section className="admin-store-card admin-store-decision-card">
                <h2>Decision</h2>
                <span className={`admin-store-status admin-store-status-${selectedSupplier.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {selectedSupplier.status}
                </span>
                {selectedSupplier.status === "Pending approval" ? (
                  <>
                    <p className="admin-store-decision-copy">
                      Checking the number at CIPC does not approve the account. Compare the details, then decide.
                    </p>
                    <button
                      type="button"
                      className="admin-store-action-button admin-store-approve-button"
                      onClick={() => openDialog("approve", selectedSupplier)}
                    >
                      Approve supplier
                    </button>
                    <button
                      type="button"
                      className="admin-store-action-button admin-store-reject-button"
                      onClick={() => openDialog("reject", selectedSupplier)}
                    >
                      Reject application
                    </button>
                  </>
                ) : selectedSupplier.status === "Active" ? (
                  <>
                    <p className="admin-store-decision-copy">
                      This supplier is active. Suspending it prevents its account users from signing in.
                    </p>
                    <button
                      type="button"
                      className="admin-store-action-button admin-store-suspend-button"
                      onClick={() => openDialog("suspend", selectedSupplier)}
                    >
                      Suspend supplier
                    </button>
                  </>
                ) : (
                  <p className="admin-store-decision-copy">
                    {selectedSupplier.status === "Suspended"
                      ? "This supplier is suspended. Existing records are kept."
                      : "This application was rejected. Its decision is recorded in the application history."}
                  </p>
                )}
              </section>

              <section className="admin-store-card">
                <h2>Contact information</h2>
                <p className="admin-store-card-subtitle">Provided by the applicant</p>
                <dl className="admin-store-fields">
                  <SupplierField label="Contact person" value={selectedSupplier.contactPerson} />
                  <SupplierField label="Mobile" value={selectedSupplier.mobile} />
                  <SupplierField label="Email" value={selectedSupplier.email} />
                </dl>
              </section>

              <section className="admin-store-card">
                <h2>Address information</h2>
                <dl className="admin-store-fields">
                  <SupplierField label="Registered" value={selectedSupplier.registeredAddress} />
                  <SupplierField label="Business address" value={selectedSupplier.businessAddress} />
                  <SupplierField label="Postal" value={selectedSupplier.postalAddress} />
                </dl>
              </section>

              <section className="admin-store-card admin-store-history-card">
                <h2>Application history</h2>
                <ol className="admin-store-history">
                  {selectedSupplier.history.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        ) : selectedSupplierId ? (
          <section className="admin-store-not-found">
            <h1>Supplier not found</h1>
            <button type="button" className="admin-stores-back admin-supplier-back" onClick={returnToList}>
              ← Back to suppliers
            </button>
          </section>
        ) : (
          <>
            <header className="admin-stores-header">
              <h1>Suppliers</h1>
              <div className="admin-stores-header-actions">
                <button type="button" className="admin-stores-export" onClick={exportSuppliers}>Export</button>
                <span className="admin-stores-avatar" aria-label="Administrator">IA</span>
              </div>
            </header>

            <div className="admin-stores-toolbar">
              <label className="admin-stores-search">
                <span className="admin-stores-visually-hidden">Search by company or CIPC number</span>
                <input
                  type="search"
                  placeholder="Search by company or CIPC number"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                <span className="admin-stores-visually-hidden">Filter by category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span className="admin-stores-visually-hidden">Filter by status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <section className="admin-store-list-card">
              <h2>All suppliers</h2>
              <div className="admin-stores-table-scroll">
                <table className="admin-stores-table admin-suppliers-table">
                  <thead>
                    <tr>
                      <th scope="col">Company</th>
                      <th scope="col">Contact person</th>
                      <th scope="col">Categories</th>
                      <th scope="col">Delivery areas</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="admin-stores-visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td>{supplier.name}</td>
                        <td>{supplier.contactPerson}</td>
                        <td>{supplier.categories.join(", ")}</td>
                        <td>{supplier.deliveryAreasSummary}</td>
                        <td>
                          <span className={`admin-store-status admin-store-status-${supplier.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {supplier.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-store-row-actions">
                            <button type="button" className="admin-store-row-button" onClick={() => openSupplier(supplier.id)}>
                              {supplier.status === "Pending approval" ? "Review" : "View"}
                            </button>
                            {supplier.status === "Active" && (
                              <button
                                type="button"
                                className="admin-store-row-button admin-store-row-suspend"
                                onClick={() => openDialog("suspend", supplier)}
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td className="admin-stores-empty" colSpan="6">No suppliers match these filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="admin-stores-count">Showing {filteredSuppliers.length} of {suppliers.length} suppliers</p>
            </section>
          </>
        )}
      </main>

      {dialog && (
        <div className="admin-store-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          {dialog.type === "approve" && (
            <section className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-supplier-modal-title">
              <SupplierModalHeader title="Approve supplier?" onClose={closeDialog} />
              <p className="admin-store-modal-copy">
                Approve {suppliers.find((supplier) => supplier.id === dialog.supplierId)?.name}? The supplier can then sign in and respond to procurement requests.
              </p>
              <p className="admin-store-modal-note">The supplier is told by email and in the app.</p>
              <div className="admin-store-modal-actions">
                <button
                  type="button"
                  className="admin-store-action-button admin-store-approve-button"
                  onClick={() => updateSupplierStatus("Active", "Approved", "Supplier approved")}
                >
                  Approve supplier
                </button>
                <button type="button" className="admin-store-action-button admin-store-cancel-button" onClick={closeDialog}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {dialog.type === "reject" && (
            <form className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-supplier-modal-title" onSubmit={submitRejection}>
              <SupplierModalHeader title="Reject application" onClose={closeDialog} />
              <label className="admin-store-modal-field">
                Reason
                <select value={rejectReason} onChange={(event) => setRejectReason(event.target.value)}>
                  <option>Details do not match CIPC</option>
                  <option>Duplicate application</option>
                  <option>Incomplete application</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="admin-store-modal-field">
                Message to the applicant
                <textarea value={rejectMessage} onChange={(event) => setRejectMessage(event.target.value)} />
              </label>
              <p className="admin-store-modal-note">The applicant sees this message and can send the application again.</p>
              <div className="admin-store-modal-actions">
                <button type="submit" className="admin-store-action-button admin-store-suspend-button">
                  Reject application
                </button>
                <button type="button" className="admin-store-action-button admin-store-cancel-button" onClick={closeDialog}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {dialog.type === "suspend" && (
            <form className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-supplier-modal-title" onSubmit={submitSuspension}>
              <SupplierModalHeader title="Suspend this supplier?" onClose={closeDialog} />
              <p className="admin-store-modal-copy">
                Suspending {suppliers.find((supplier) => supplier.id === dialog.supplierId)?.name} stops its account users from signing in.
              </p>
              <label className="admin-store-modal-field">
                Reason
                <select value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)}>
                  <option>Other</option>
                  <option>Policy violation</option>
                  <option>Suspected fraud</option>
                  <option>Inactive supplier</option>
                </select>
              </label>
              <label className="admin-store-modal-field">
                Note (kept in the audit log)
                <textarea value={suspendNote} onChange={(event) => setSuspendNote(event.target.value)} />
              </label>
              <div className="admin-store-modal-actions">
                <button type="submit" className="admin-store-action-button admin-store-suspend-button">
                  Suspend supplier
                </button>
                <button type="button" className="admin-store-action-button admin-store-cancel-button" onClick={closeDialog}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const SupplierField = ({ label, value }) => (
  <div className="admin-store-field">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const SupplierModalHeader = ({ title, onClose }) => (
  <header className="admin-store-modal-header">
    <h2 id="admin-supplier-modal-title">{title}</h2>
    <button type="button" aria-label="Close" onClick={onClose}>×</button>
  </header>
);

export default AdminSuppliers;