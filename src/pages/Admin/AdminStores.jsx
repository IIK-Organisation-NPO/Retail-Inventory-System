import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../Style/Admin/AdminStores.css";

const INITIAL_STORES = [
  {
    id: "mseleku-tuckshop",
    name: "Mseleku Tuckshop",
    owner: "Sipho Dlamini",
    municipality: "Msunduzi",
    province: "KwaZulu-Natal",
    status: "Active",
    staff: 3,
    lastSync: "2 min ago",
    registrationNumber: "2019/123456/07",
    registeredName: "Mseleku Tuckshop (Pty) Ltd",
    companyType: "Private Company",
    registered: "7 June 2019",
    cipcStatus: "In Business",
    category: "Groceries",
    description: "Convenience groceries and household essentials",
    hours: "Mon to Sat, 07:00 to 19:00",
    contactPerson: "Sipho Dlamini",
    phone: "082 000 0001",
    email: "sipho@example.co.za",
    registeredAddress: "24 Church Street, Imbali, 3201",
    storeAddress: "Same as registered",
    history: [
      { title: "Approved", detail: "Store is active" },
      { title: "CIPC check", detail: "Found, In Business" },
    ],
  },
  {
    id: "vusis-tuckshop",
    name: "Vusis Tuckshop",
    owner: "Nomsa Zulu",
    municipality: "Msunduzi",
    province: "KwaZulu-Natal",
    status: "Active",
    staff: 1,
    lastSync: "5 min ago",
    registrationNumber: "2021/654321/07",
    registeredName: "Vusis Tuckshop",
    companyType: "Private Company",
    registered: "18 October 2021",
    cipcStatus: "In Business",
    category: "Groceries",
    description: "Everyday groceries",
    hours: "Mon to Fri, 08:00 to 18:00",
    contactPerson: "Nomsa Zulu",
    phone: "082 000 0002",
    email: "nomsa@example.co.za",
    registeredAddress: "6 Market Road, Imbali, 3201",
    storeAddress: "Same as registered",
    history: [
      { title: "Approved", detail: "Store is active" },
      { title: "CIPC check", detail: "Found, In Business" },
    ],
  },
  {
    id: "edendale-spaza",
    name: "Edendale Spaza",
    owner: "Thabo Mkhize",
    municipality: "Msunduzi",
    province: "KwaZulu-Natal",
    status: "Pending approval",
    staff: 1,
    lastSync: "Not live yet",
    registrationNumber: "2024/123456/07",
    registeredName: "Edendale Spaza Trading (Pty) Ltd",
    companyType: "Private Company",
    registered: "12 March 2024",
    cipcStatus: "In Business",
    category: "Groceries",
    description: "Everyday groceries",
    hours: "Mon to Sat, 07:00 to 19:00",
    contactPerson: "Thabo Mkhize",
    phone: "082 000 0003",
    email: "thabo@example.co.za",
    registeredAddress: "18 Main Road, Edendale, 3217",
    storeAddress: "Same as registered",
    history: [
      { title: "Submitted", detail: "12 Nov, 10:05 by Thabo Mkhize" },
      { title: "CIPC check", detail: "Found, In Business" },
    ],
  },
];

const STATUS_OPTIONS = ["All statuses", "Active", "Pending approval", "Suspended", "Rejected"];

const AdminStores = () => {
  const [stores, setStores] = useState(INITIAL_STORES);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All provinces");
  const [status, setStatus] = useState("All statuses");
  const [dialog, setDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("Details do not match CIPC");
  const [rejectMessage, setRejectMessage] = useState("");
  const [suspendReason, setSuspendReason] = useState("Other");
  const [suspendNote, setSuspendNote] = useState("");

  const selectedStoreId = searchParams.get("store");
  const selectedStore = stores.find((store) => store.id === selectedStoreId);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredStores = stores.filter((store) => {
    const matchesSearch = [
      store.name,
      store.owner,
      store.registrationNumber,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesProvince = province === "All provinces" || store.province === province;
    const matchesStatus = status === "All statuses" || store.status === status;
    return matchesSearch && matchesProvince && matchesStatus;
  });

  const openStore = (storeId) => setSearchParams({ store: storeId });
  const returnToList = () => setSearchParams({});

  const openDialog = (type, store) => {
    setDialog({ type, storeId: store.id });
    setRejectReason("Details do not match CIPC");
    setRejectMessage("");
    setSuspendReason("Other");
    setSuspendNote("");
  };

  const closeDialog = () => setDialog(null);

  const updateStoreStatus = (nextStatus, action, detail) => {
    if (!dialog) return;

    setStores((currentStores) => currentStores.map((store) => (
      store.id === dialog.storeId
        ? {
          ...store,
          status: nextStatus,
          lastSync: nextStatus === "Active" ? "Not synced yet" : store.lastSync,
          history: [{ title: action, detail }, ...store.history],
        }
        : store
    )));
    closeDialog();
  };

  const exportStores = () => {
    const headers = ["Store", "Owner", "Municipality", "Province", "Status", "Staff", "Last sync", "CIPC number"];
    const rows = filteredStores.map((store) => [
      store.name,
      store.owner,
      store.municipality,
      store.province,
      store.status,
      store.staff,
      store.lastSync,
      store.registrationNumber,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "stores.csv";
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
    updateStoreStatus("Rejected", "Application rejected", detail);
  };

  const submitSuspension = (event) => {
    event.preventDefault();
    const detail = suspendNote.trim()
      ? `${suspendReason} — ${suspendNote.trim()}`
      : suspendReason;
    updateStoreStatus("Suspended", "Store suspended", detail);
  };

  return (
    <div className="admin-stores-layout">
      <AdminSidebar />

      <main className="admin-stores-main">
        {selectedStore ? (
          <>
            <header className="admin-stores-header">
              <h1>{selectedStore.name}</h1>
              <span className="admin-stores-avatar" aria-label="Administrator">IA</span>
            </header>

            <button type="button" className="admin-stores-back" onClick={returnToList}>
              ← Back to stores
            </button>

            <div className="admin-store-detail-grid">
              <section className="admin-store-card">
                <h2>CIPC verification</h2>
                <p className="admin-store-card-subtitle">Read-only, from CIPC</p>
                <dl className="admin-store-fields">
                  <StoreField label="Registration number" value={selectedStore.registrationNumber} />
                  <StoreField label="Registered name" value={selectedStore.registeredName} />
                  <StoreField label="Company type" value={selectedStore.companyType} />
                  <StoreField label="Registered" value={selectedStore.registered} />
                  <StoreField label="Status" value={selectedStore.cipcStatus} />
                </dl>
              </section>

              <section className="admin-store-card">
                <h2>Profile</h2>
                <p className="admin-store-card-subtitle">Provided by the applicant</p>
                <dl className="admin-store-fields">
                  <StoreField label="Trading name" value={selectedStore.name} />
                  <StoreField label="Category" value={selectedStore.category} />
                  <StoreField label="Description" value={selectedStore.description} />
                  <StoreField label="Hours" value={selectedStore.hours} />
                </dl>
              </section>

              <section className="admin-store-card admin-store-decision-card">
                <h2>Decision</h2>
                <span className={`admin-store-status admin-store-status-${selectedStore.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {selectedStore.status}
                </span>
                {selectedStore.status === "Pending approval" ? (
                  <>
                    <p className="admin-store-decision-copy">
                      Checking the number at CIPC does not approve the account. Compare the details, then decide.
                    </p>
                    <button
                      type="button"
                      className="admin-store-action-button admin-store-approve-button"
                      onClick={() => openDialog("approve", selectedStore)}
                    >
                      Approve store
                    </button>
                    <button
                      type="button"
                      className="admin-store-action-button admin-store-reject-button"
                      onClick={() => openDialog("reject", selectedStore)}
                    >
                      Reject application
                    </button>
                  </>
                ) : selectedStore.status === "Active" ? (
                  <>
                    <p className="admin-store-decision-copy">
                      This store is active. Suspending it prevents the owner and staff from signing in.
                    </p>
                    <button
                      type="button"
                      className="admin-store-action-button admin-store-suspend-button"
                      onClick={() => openDialog("suspend", selectedStore)}
                    >
                      Suspend store
                    </button>
                  </>
                ) : (
                  <p className="admin-store-decision-copy">
                    {selectedStore.status === "Suspended"
                      ? "This store is suspended. Sales and stock records are kept."
                      : "This application was rejected. Its decision is recorded in the application history."}
                  </p>
                )}
              </section>

              <section className="admin-store-card">
                <h2>Contact information</h2>
                <p className="admin-store-card-subtitle">Provided by the applicant</p>
                <dl className="admin-store-fields">
                  <StoreField label="Contact person" value={selectedStore.contactPerson} />
                  <StoreField label="Phone" value={selectedStore.phone} />
                  <StoreField label="Email" value={selectedStore.email} />
                </dl>
              </section>

              <section className="admin-store-card">
                <h2>Address information</h2>
                <dl className="admin-store-fields">
                  <StoreField label="Registered" value={selectedStore.registeredAddress} />
                  <StoreField label="Store address" value={selectedStore.storeAddress} />
                  <StoreField label="Municipality" value={selectedStore.municipality} />
                </dl>
              </section>

              <section className="admin-store-card admin-store-history-card">
                <h2>Application history</h2>
                <ol className="admin-store-history">
                  {selectedStore.history.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        ) : selectedStoreId ? (
          <section className="admin-store-not-found">
            <h1>Store not found</h1>
            <button type="button" className="admin-stores-back" onClick={returnToList}>
              ← Back to stores
            </button>
          </section>
        ) : (
          <>
            <header className="admin-stores-header">
              <h1>Stores</h1>
              <div className="admin-stores-header-actions">
                <button type="button" className="admin-stores-export" onClick={exportStores}>Export</button>
                <span className="admin-stores-avatar" aria-label="Administrator">IA</span>
              </div>
            </header>

            <div className="admin-stores-toolbar">
              <label className="admin-stores-search">
                <span className="admin-stores-visually-hidden">Search by store, owner or CIPC number</span>
                <input
                  type="search"
                  placeholder="Search by store, owner or CIPC number"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                <span className="admin-stores-visually-hidden">Filter by province</span>
                <select value={province} onChange={(event) => setProvince(event.target.value)}>
                  <option>All provinces</option>
                  <option>Eastern Cape</option>
                  <option>Free State</option>
                  <option>Gauteng</option>
                  <option>KwaZulu-Natal</option>
                  <option>Limpopo</option>
                  <option>Mpumalanga</option>
                  <option>Northern Cape</option>
                  <option>North West</option>
                  <option>Western Cape</option>
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
              <h2>All stores</h2>
              <div className="admin-stores-table-scroll">
                <table className="admin-stores-table">
                  <thead>
                    <tr>
                      <th scope="col">Store</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Municipality</th>
                      <th scope="col">Status</th>
                      <th scope="col">Staff</th>
                      <th scope="col">Last sync</th>
                      <th scope="col"><span className="admin-stores-visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.map((store) => (
                      <tr key={store.id}>
                        <td>{store.name}</td>
                        <td>{store.owner}</td>
                        <td>{store.municipality}</td>
                        <td>
                          <span className={`admin-store-status admin-store-status-${store.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {store.status}
                          </span>
                        </td>
                        <td>{store.staff}</td>
                        <td>{store.lastSync}</td>
                        <td>
                          <div className="admin-store-row-actions">
                            <button type="button" className="admin-store-row-button" onClick={() => openStore(store.id)}>
                              {store.status === "Pending approval" ? "Review" : "View"}
                            </button>
                            {store.status === "Active" && (
                              <button
                                type="button"
                                className="admin-store-row-button admin-store-row-suspend"
                                onClick={() => openDialog("suspend", store)}
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStores.length === 0 && (
                      <tr>
                        <td className="admin-stores-empty" colSpan="7">No stores match these filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="admin-stores-count">Showing {filteredStores.length} of {stores.length} stores</p>
            </section>
          </>
        )}
      </main>

      {dialog && (
        <div className="admin-store-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          {dialog.type === "approve" && (
            <section className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-store-modal-title">
              <ModalHeader title="Approve store?" onClose={closeDialog} />
              <p className="admin-store-modal-copy">
                Approve {stores.find((store) => store.id === dialog.storeId)?.name}? The owner can then sign in, add products and send procurement requests.
              </p>
              <p className="admin-store-modal-note">The owner is told by email and in the app.</p>
              <div className="admin-store-modal-actions">
                <button
                  type="button"
                  className="admin-store-action-button admin-store-approve-button"
                  onClick={() => updateStoreStatus("Active", "Approved", "Store approved")}
                >
                  Approve store
                </button>
                <button type="button" className="admin-store-action-button admin-store-cancel-button" onClick={closeDialog}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {dialog.type === "reject" && (
            <form className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-store-modal-title" onSubmit={submitRejection}>
              <ModalHeader title="Reject application" onClose={closeDialog} />
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
            <form className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-store-modal-title" onSubmit={submitSuspension}>
              <ModalHeader title="Suspend this store?" onClose={closeDialog} />
              <p className="admin-store-modal-copy">
                Suspending {stores.find((store) => store.id === dialog.storeId)?.name} stops its owner and staff from signing in. Sales and stock records are kept.
              </p>
              <label className="admin-store-modal-field">
                Reason
                <select value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)}>
                  <option>Other</option>
                  <option>Policy violation</option>
                  <option>Suspected fraud</option>
                  <option>Inactive store</option>
                </select>
              </label>
              <label className="admin-store-modal-field">
                Note (kept in the audit log)
                <textarea value={suspendNote} onChange={(event) => setSuspendNote(event.target.value)} />
              </label>
              <div className="admin-store-modal-actions">
                <button type="submit" className="admin-store-action-button admin-store-suspend-button">
                  Suspend store
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

const StoreField = ({ label, value }) => (
  <div className="admin-store-field">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const ModalHeader = ({ title, onClose }) => (
  <header className="admin-store-modal-header">
    <h2 id="admin-store-modal-title">{title}</h2>
    <button type="button" aria-label="Close" onClick={onClose}>×</button>
  </header>
);

export default AdminStores;
