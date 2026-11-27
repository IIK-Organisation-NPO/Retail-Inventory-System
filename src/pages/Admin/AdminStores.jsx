import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminStores.css";

const API_BASE = "http://localhost:5000";

// Database status -> label shown in the UI.
const STATUS_LABELS = {
  Pending: "Pending approval",
  Approved: "Active",
  Rejected: "Rejected",
  Suspended: "Suspended",
};

const STATUS_OPTIONS = ["All statuses", "Active", "Pending approval", "Suspended", "Rejected"];

const ERROR_STYLE = { color: "#c62828", fontSize: "0.85rem", marginTop: 4 };

const getAuthToken = () =>
  localStorage.getItem("adminToken") || localStorage.getItem("token");

const statusClass = (label) =>
  `admin-store-status admin-store-status-${String(label).toLowerCase().replace(/\s+/g, "-")}`;

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) =>
  `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const buildReason = (reason, message) =>
  message.trim() ? `${reason} — ${message.trim()}` : reason;

// Small fetch wrapper: adds the token, parses JSON and throws a useful error.
const api = async (path, options = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("No token. Please log in again.");

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const message = body.debug
      ? `${body.message || "Request failed."} (${body.debug})`
      : body.message || "Request failed.";
    const error = new Error(message);
    error.status = res.status;
    error.errors = body.errors || {};
    throw error;
  }
  return body;
};

const mapListStore = (store) => ({
  id: String(store.storeId),
  name: store.storeName || "—",
  owner: (store.owner && store.owner.name) || "—",
  municipality: store.municipality || "—",
  province: store.province || "",
  status: STATUS_LABELS[store.status] || store.status,
  staff: store.staffCount || 0,
  lastActivity: store.lastActivity,
  registrationNumber: store.registrationNumber || "",
});

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All provinces");
  const [status, setStatus] = useState("All statuses");

  const [dialog, setDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("Details do not match CIPC");
  const [rejectMessage, setRejectMessage] = useState("");
  const [suspendReason, setSuspendReason] = useState("Other");
  const [suspendNote, setSuspendNote] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const selectedStoreId = searchParams.get("store");

  const loadStores = useCallback(async () => {
    try {
      const body = await api("/api/admin/stores");
      setStores((body.stores || []).map(mapListStore));
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Failed to load stores.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (storeId) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const body = await api(`/api/admin/stores/${storeId}`);
      setDetail(body);
    } catch (err) {
      setDetail(null);
      setDetailError({ message: err.message, status: err.status });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadStores();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loadStores]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (selectedStoreId) {
        await loadDetail(selectedStoreId);
      } else {
        setDetail(null);
        setDetailError(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, loadDetail]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStores = stores.filter((store) => {
    const matchesSearch = [store.name, store.owner, store.registrationNumber].some((value) =>
      String(value || "").toLowerCase().includes(normalizedSearch)
    );
    const matchesProvince = province === "All provinces" || store.province === province;
    const matchesStatus = status === "All statuses" || store.status === status;
    return matchesSearch && matchesProvince && matchesStatus;
  });

  const openStore = (storeId) => {
    setActionMessage("");
    setSearchParams({ store: storeId });
  };
  const returnToList = () => {
    setActionMessage("");
    setSearchParams({});
  };

  // store = { id, name, status } where status is the UI label.
  const openDialog = (type, store) => {
    setDialog({ type, storeId: store.id, storeName: store.name, status: store.status });
    setRejectReason("Details do not match CIPC");
    setRejectMessage("");
    setSuspendReason("Other");
    setSuspendNote("");
    setFormErrors({});
    setActionMessage("");
  };

  const closeDialog = () => {
    setDialog(null);
    setFormErrors({});
  };

  const submitStatus = async (nextStatus, reason, successMessage) => {
    if (!dialog) return;
    setSubmitting(true);
    setFormErrors({});
    try {
      await api(`/api/admin/stores/${dialog.storeId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      closeDialog();
      setActionMessage(successMessage);
      await loadStores();
      if (selectedStoreId) await loadDetail(selectedStoreId);
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length > 0) {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ general: err.message || "Something went wrong." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitApproval = () => {
    const reactivating = dialog && dialog.status === "Suspended";
    submitStatus(
      "Approved",
      "",
      reactivating ? "Store reactivated." : "Store approved."
    );
  };

  const submitRejection = (event) => {
    event.preventDefault();
    if (rejectReason === "Other" && !rejectMessage.trim()) {
      setFormErrors({ message: "Enter a message when the reason is Other." });
      return;
    }
    submitStatus("Rejected", buildReason(rejectReason, rejectMessage), "Application rejected.");
  };

  const submitSuspension = (event) => {
    event.preventDefault();
    if (suspendReason === "Other" && !suspendNote.trim()) {
      setFormErrors({ message: "Enter a note when the reason is Other." });
      return;
    }
    submitStatus("Suspended", buildReason(suspendReason, suspendNote), "Store suspended.");
  };

  const exportStores = () => {
    const headers = [
      "Store",
      "Owner",
      "Municipality",
      "Province",
      "Status",
      "Staff",
      "Last activity",
      "CIPC number",
    ];
    const rows = filteredStores.map((store) => [
      store.name,
      store.owner,
      store.municipality,
      store.province,
      store.status,
      store.staff,
      store.lastActivity ? formatDateTime(store.lastActivity) : "No activity yet",
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

  // Detail view data (built from the API response).
  const detailStore = detail ? detail.store : null;
  const detailStatus = detailStore ? STATUS_LABELS[detailStore.status] || detailStore.status : "";
  const functionality = detail ? detail.functionality : null;
  const detailForDialog = detailStore
    ? { id: String(detailStore.storeId), name: detailStore.storeName, status: detailStatus }
    : null;

  const renderDetail = () => {
    if (detailLoading && !detail) {
      return <p className="admin-store-modal-note">Loading store…</p>;
    }

    if (detailError || !detailStore) {
      return (
        <section className="admin-store-not-found">
          <h1>Store not found</h1>
          {detailError && detailError.status !== 404 && (
            <p style={ERROR_STYLE} role="alert">
              {detailError.message}
            </p>
          )}
          <button type="button" className="admin-stores-back" onClick={returnToList}>
            ← Back to stores
          </button>
        </section>
      );
    }

    return (
      <>
        <header className="admin-stores-header">
          <h1>{detailStore.storeName}</h1>
          <AdminUserMenu />
        </header>

        <button type="button" className="admin-stores-back" onClick={returnToList}>
          ← Back to stores
        </button>

        {actionMessage && (
          <p className="admin-store-modal-note" role="status">
            {actionMessage}
          </p>
        )}

        <div className="admin-store-detail-grid">
          <section className="admin-store-card">
            <h2>CIPC verification</h2>
            <p className="admin-store-card-subtitle">Read-only, from CIPC</p>
            <dl className="admin-store-fields">
              <StoreField label="Registration number" value={detailStore.registrationNumber} />
              <StoreField label="Registered name" value="" />
              <StoreField label="Company type" value="" />
              <StoreField label="Registered" value="" />
              <StoreField label="Status" value="" />
            </dl>
          </section>

          <section className="admin-store-card">
            <h2>Profile</h2>
            <p className="admin-store-card-subtitle">Provided by the applicant</p>
            <dl className="admin-store-fields">
              <StoreField label="Trading name" value={detailStore.storeName} />
              <StoreField label="Category" value="" />
              <StoreField label="Description" value="" />
              <StoreField label="Hours" value="" />
            </dl>
          </section>

          <section className="admin-store-card admin-store-decision-card">
            <h2>Decision</h2>
            <span className={statusClass(detailStatus)}>{detailStatus}</span>
            {detailStatus === "Pending approval" ? (
              <>
                <p className="admin-store-decision-copy">
                  Checking the number at CIPC does not approve the account. Compare the details, then decide.
                </p>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-approve-button"
                  onClick={() => openDialog("approve", detailForDialog)}
                >
                  Approve store
                </button>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-reject-button"
                  onClick={() => openDialog("reject", detailForDialog)}
                >
                  Reject application
                </button>
              </>
            ) : detailStatus === "Active" ? (
              <>
                <p className="admin-store-decision-copy">
                  This store is active. Suspending it prevents the owner and staff from signing in.
                </p>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-suspend-button"
                  onClick={() => openDialog("suspend", detailForDialog)}
                >
                  Suspend store
                </button>
              </>
            ) : detailStatus === "Suspended" ? (
              <>
                <p className="admin-store-decision-copy">
                  This store is suspended. Sales and stock records are kept.
                </p>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-approve-button"
                  onClick={() => openDialog("approve", detailForDialog)}
                >
                  Reactivate store
                </button>
              </>
            ) : (
              <p className="admin-store-decision-copy">
                This application was rejected. Its decision is recorded in the application history.
              </p>
            )}
          </section>

          <section className="admin-store-card">
            <h2>Contact information</h2>
            <p className="admin-store-card-subtitle">Provided by the applicant</p>
            <dl className="admin-store-fields">
              <StoreField label="Contact person" value={detailStore.owner.name} />
              <StoreField label="Phone" value={detailStore.contactNumber || detailStore.owner.mobileNumber} />
              <StoreField label="Email" value={detailStore.email || detailStore.owner.email} />
            </dl>
          </section>

          <section className="admin-store-card">
            <h2>Address information</h2>
            <dl className="admin-store-fields">
              <StoreField label="Registered" value="" />
              <StoreField label="Store address" value={detailStore.address} />
              <StoreField label="Municipality" value={detailStore.municipality} />
              <StoreField label="Province" value={detailStore.province} />
            </dl>
          </section>

          {functionality && (
            <section className="admin-store-card">
              <h2>Store activity</h2>
              <p className="admin-store-card-subtitle">Read-only, from the store's records</p>
              <dl className="admin-store-fields">
                <StoreField
                  label="Staff"
                  value={`${functionality.staff.active} active of ${functionality.staff.total}`}
                />
                <StoreField label="Products in stock list" value={String(functionality.inventory.productCount)} />
                <StoreField label="Low stock items" value={String(functionality.inventory.lowStockCount)} />
                <StoreField
                  label="Sales, last 30 days"
                  value={`${functionality.sales.last30DaysCount} (${formatMoney(functionality.sales.last30DaysValue)})`}
                />
                <StoreField label="Last sale" value={formatDateTime(functionality.sales.lastSaleAt)} />
                <StoreField
                  label="Setup checklist"
                  value={[
                    `${functionality.checklist.hasStaff ? "✓" : "✗"} Staff`,
                    `${functionality.checklist.hasProducts ? "✓" : "✗"} Products`,
                    `${functionality.checklist.hasSales ? "✓" : "✗"} Sales`,
                  ].join("   ")}
                />
              </dl>
            </section>
          )}

          <section className="admin-store-card admin-store-history-card">
            <h2>Application history</h2>
            <ol className="admin-store-history">
              {(detail.history || []).map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.detail}
                    {item.at ? ` · ${formatDateTime(item.at)}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </>
    );
  };

  const renderList = () => (
    <>
      <header className="admin-stores-header">
        <h1>Stores</h1>
        <div className="admin-stores-header-actions">
          <button type="button" className="admin-stores-export" onClick={exportStores}>
            Export
          </button>
          <AdminUserMenu />
        </div>
      </header>

      {loadError && (
        <p style={ERROR_STYLE} role="alert">
          {loadError}
        </p>
      )}

      {actionMessage && (
        <p className="admin-store-modal-note" role="status">
          {actionMessage}
        </p>
      )}

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
            {STATUS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
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
                <th scope="col">Last activity</th>
                <th scope="col">
                  <span className="admin-stores-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="admin-stores-empty" colSpan="7">
                    Loading stores…
                  </td>
                </tr>
              )}
              {!loading &&
                filteredStores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.owner}</td>
                    <td>{store.municipality}</td>
                    <td>
                      <span className={statusClass(store.status)}>{store.status}</span>
                    </td>
                    <td>{store.staff}</td>
                    <td>{store.lastActivity ? formatDateTime(store.lastActivity) : "No activity yet"}</td>
                    <td>
                      <div className="admin-store-row-actions">
                        <button
                          type="button"
                          className="admin-store-row-button"
                          onClick={() => openStore(store.id)}
                        >
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
              {!loading && filteredStores.length === 0 && (
                <tr>
                  <td className="admin-stores-empty" colSpan="7">
                    No stores match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="admin-stores-count">
          Showing {filteredStores.length} of {stores.length} stores
        </p>
      </section>
    </>
  );

  const messageError = formErrors.message || formErrors.reason;

  return (
    <div className="admin-stores-layout">
      <AdminSidebar />

      <main className="admin-stores-main">{selectedStoreId ? renderDetail() : renderList()}</main>

      {dialog && (
        <div
          className="admin-store-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          {dialog.type === "approve" && (
            <section
              className="admin-store-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-store-modal-title"
            >
              <ModalHeader
                title={dialog.status === "Suspended" ? "Reactivate store?" : "Approve store?"}
                onClose={closeDialog}
              />
              <p className="admin-store-modal-copy">
                {dialog.status === "Suspended"
                  ? `Reactivate ${dialog.storeName}? Its owner and staff will be able to use it again.`
                  : `Approve ${dialog.storeName}? The owner can then sign in, add products and send procurement requests.`}
              </p>
              <p className="admin-store-modal-note">The owner is told in the app.</p>
              {formErrors.general && (
                <p style={ERROR_STYLE} role="alert">
                  {formErrors.general}
                </p>
              )}
              {formErrors.status && !formErrors.general && (
                <p style={ERROR_STYLE} role="alert">
                  {formErrors.status}
                </p>
              )}
              <div className="admin-store-modal-actions">
                <button
                  type="button"
                  className="admin-store-action-button admin-store-approve-button"
                  onClick={submitApproval}
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving…"
                    : dialog.status === "Suspended"
                    ? "Reactivate store"
                    : "Approve store"}
                </button>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-cancel-button"
                  onClick={closeDialog}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {dialog.type === "reject" && (
            <form
              className="admin-store-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-store-modal-title"
              onSubmit={submitRejection}
              noValidate
            >
              <ModalHeader title="Reject application" onClose={closeDialog} />
              <label className="admin-store-modal-field">
                Reason
                <select
                  value={rejectReason}
                  onChange={(event) => {
                    setRejectReason(event.target.value);
                    setFormErrors({});
                  }}
                >
                  <option>Details do not match CIPC</option>
                  <option>Duplicate application</option>
                  <option>Incomplete application</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="admin-store-modal-field">
                Message to the applicant
                <textarea
                  value={rejectMessage}
                  maxLength={200}
                  aria-invalid={Boolean(messageError)}
                  aria-describedby={messageError ? "admin-store-message-error" : undefined}
                  onChange={(event) => {
                    setRejectMessage(event.target.value);
                    setFormErrors({});
                  }}
                />
                {messageError && (
                  <span id="admin-store-message-error" style={ERROR_STYLE} role="alert">
                    {messageError}
                  </span>
                )}
              </label>
              <p className="admin-store-modal-note">
                The applicant sees this message and can send the application again.
              </p>
              {(formErrors.general || formErrors.status) && (
                <p style={ERROR_STYLE} role="alert">
                  {formErrors.general || formErrors.status}
                </p>
              )}
              <div className="admin-store-modal-actions">
                <button
                  type="submit"
                  className="admin-store-action-button admin-store-suspend-button"
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Reject application"}
                </button>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-cancel-button"
                  onClick={closeDialog}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {dialog.type === "suspend" && (
            <form
              className="admin-store-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-store-modal-title"
              onSubmit={submitSuspension}
              noValidate
            >
              <ModalHeader title="Suspend this store?" onClose={closeDialog} />
              <p className="admin-store-modal-copy">
                Suspending {dialog.storeName} stops its owner and staff from signing in. Sales and
                stock records are kept.
              </p>
              <label className="admin-store-modal-field">
                Reason
                <select
                  value={suspendReason}
                  onChange={(event) => {
                    setSuspendReason(event.target.value);
                    setFormErrors({});
                  }}
                >
                  <option>Other</option>
                  <option>Policy violation</option>
                  <option>Suspected fraud</option>
                  <option>Inactive store</option>
                </select>
              </label>
              <label className="admin-store-modal-field">
                Note (kept in the audit log)
                <textarea
                  value={suspendNote}
                  maxLength={200}
                  aria-invalid={Boolean(messageError)}
                  aria-describedby={messageError ? "admin-store-message-error" : undefined}
                  onChange={(event) => {
                    setSuspendNote(event.target.value);
                    setFormErrors({});
                  }}
                />
                {messageError && (
                  <span id="admin-store-message-error" style={ERROR_STYLE} role="alert">
                    {messageError}
                  </span>
                )}
              </label>
              {(formErrors.general || formErrors.status) && (
                <p style={ERROR_STYLE} role="alert">
                  {formErrors.general || formErrors.status}
                </p>
              )}
              <div className="admin-store-modal-actions">
                <button
                  type="submit"
                  className="admin-store-action-button admin-store-suspend-button"
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Suspend store"}
                </button>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-cancel-button"
                  onClick={closeDialog}
                  disabled={submitting}
                >
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
    <dd>{value || "—"}</dd>
  </div>
);

const ModalHeader = ({ title, onClose }) => (
  <header className="admin-store-modal-header">
    <h2 id="admin-store-modal-title">{title}</h2>
    <button type="button" aria-label="Close" onClick={onClose}>
      ×
    </button>
  </header>
);

export default AdminStores;