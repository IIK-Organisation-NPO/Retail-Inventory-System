import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminStores.css";
import "../../Style/Admin/AdminUsers.css";

const API_URL = "http://localhost:5000/api";

const ROLES = ["All roles", "Admin", "Store Owner", "Store Staff", "Supplier"];
const STATUSES = ["All statuses", "Active", "Disabled"];
const USERS_PER_PAGE = 8;

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const request = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fieldError = data.errors && Object.values(data.errors)[0];
    throw new Error(fieldError || data.message || "Something went wrong.");
  }
  return data;
};

const errorStyle = { color: "#c62828", margin: "8px 0" };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const data = await request("/admin/users");
        if (!cancelled) setUsers(data.users || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Could not load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedUserId = searchParams.get("user");
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.name, user.mobile, user.email]
      .some((value) => (value || "").toLowerCase().includes(normalizedSearch));
    const matchesRole = role === "All roles" || user.role === role;
    const matchesStatus = status === "All statuses" || user.status === status;
    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const visibleUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);
  const modalUser = modal?.userId ? users.find((user) => user.id === modal.userId) : null;

  const resetFilters = () => setPage(1);
  const openUser = (userId) => {
    setActionError("");
    setSearchParams({ user: userId });
  };
  const returnToList = () => {
    setActionError("");
    setSearchParams({});
  };
  const openDisableModal = (userId) => {
    setActionError("");
    setModal({ type: "disable", userId });
  };
  const closeModal = () => {
    setActionError("");
    setModal(null);
  };

  const updateUserStatus = async (userId, nextStatus) => {
    try {
      setSaving(true);
      setActionError("");
      const data = await request(`/admin/users/${encodeURIComponent(userId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id === userId ? { ...user, status: data.user.status } : user
      )));
      setModal(null);
    } catch (err) {
      setActionError(err.message || "Could not update this user.");
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <header className="admin-stores-header">
            <h1>Users</h1>
            <div className="admin-stores-header-actions">
              <AdminUserMenu />
            </div>
          </header>
          <p>Loading users...</p>
        </>
      );
    }

    if (loadError) {
      return (
        <>
          <header className="admin-stores-header">
            <h1>Users</h1>
            <div className="admin-stores-header-actions">
              <AdminUserMenu />
            </div>
          </header>
          <p role="alert" style={errorStyle}>{loadError}</p>
        </>
      );
    }

    if (selectedUser) {
      return (
        <>
          {actionError && !modal && <p role="alert" style={errorStyle}>{actionError}</p>}
          <UserDetail
            user={selectedUser}
            saving={saving}
            onBack={returnToList}
            onDisable={() => openDisableModal(selectedUser.id)}
            onEnable={() => updateUserStatus(selectedUser.id, "Active")}
          />
        </>
      );
    }

    if (selectedUserId) {
      return (
        <section className="admin-store-not-found">
          <h1>User not found</h1>
          <button type="button" className="admin-stores-back" onClick={returnToList}>
            ← Back to users
          </button>
        </section>
      );
    }

    return (
      <>
        <header className="admin-stores-header">
          <h1>Users</h1>
          <div className="admin-stores-header-actions">
            <AdminUserMenu />
          </div>
        </header>

        {actionError && !modal && <p role="alert" style={errorStyle}>{actionError}</p>}

        <div className="admin-stores-toolbar">
          <label className="admin-stores-search">
            <span className="admin-stores-visually-hidden">Search by name, mobile or email</span>
            <input
              type="search"
              placeholder="Search by name, mobile or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetFilters();
              }}
            />
          </label>
          <label>
            <span className="admin-stores-visually-hidden">Filter by role</span>
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                resetFilters();
              }}
            >
              {ROLES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="admin-stores-visually-hidden">Filter by status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                resetFilters();
              }}
            >
              {STATUSES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <section className="admin-store-list-card admin-users-list-card">
          <h2>All users</h2>
          <div className="admin-stores-table-scroll">
            <table className="admin-stores-table admin-users-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Store or company</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last sign-in</th>
                  <th scope="col"><span className="admin-stores-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{user.organization}</td>
                    <td>
                      <span className={`admin-store-status admin-user-status-${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{formatDateTime(user.lastSignIn)}</td>
                    <td>
                      <div className="admin-store-row-actions">
                        <button
                          type="button"
                          className="admin-store-row-button"
                          onClick={() => openUser(user.id)}
                        >
                          View
                        </button>
                        {user.status === "Active" ? (
                          <button
                            type="button"
                            className="admin-store-row-button admin-user-disable-button"
                            disabled={saving}
                            onClick={() => openDisableModal(user.id)}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-store-row-button admin-user-enable-button"
                            disabled={saving}
                            onClick={() => updateUserStatus(user.id, "Active")}
                          >
                            Enable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && (
                  <tr>
                    <td className="admin-stores-empty" colSpan="6">No users match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-users-list-footer">
            <p className="admin-stores-count">Showing {visibleUsers.length} of {filteredUsers.length} users</p>
            {totalPages > 1 && (
              <div className="admin-users-pagination" aria-label="User list pages">
                <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="admin-stores-layout">
      <AdminSidebar />

      <main className="admin-stores-main">
        {renderContent()}
      </main>

      {modal && (
        <div className="admin-store-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          {modal.type === "disable" && modalUser && (
            <section className="admin-store-modal admin-user-disable-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-disable-title">
              <header className="admin-store-modal-header">
                <h2 id="admin-user-disable-title">Disable user?</h2>
                <button type="button" aria-label="Close" onClick={closeModal}>×</button>
              </header>
              <p className="admin-store-modal-copy">
                Disable {modalUser.name} ({modalUser.role}, {modalUser.organization})? They will not be able to sign in. {modalUser.role === "Store Staff" ? "Their past sales stay on record." : "Their past activity stays on record."}
              </p>
              <p className="admin-store-modal-note admin-user-enable-note">You can enable the user again at any time.</p>
              {actionError && <p role="alert" style={errorStyle}>{actionError}</p>}
              <div className="admin-store-modal-actions">
                <button
                  type="button"
                  className="admin-store-action-button admin-store-suspend-button"
                  disabled={saving}
                  onClick={() => updateUserStatus(modalUser.id, "Disabled")}
                >
                  {saving ? "Disabling..." : "Disable user"}
                </button>
                <button
                  type="button"
                  className="admin-store-action-button admin-store-cancel-button"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const UserDetail = ({ user, saving, onBack, onDisable, onEnable }) => (
  <>
    <header className="admin-stores-header">
      <h1>{user.name}</h1>
      <AdminUserMenu />
    </header>

    <button type="button" className="admin-stores-back admin-user-back" onClick={onBack}>
      ← Back to users
    </button>

    <div className="admin-store-detail-grid">
      <section className="admin-store-card">
        <h2>User information</h2>
        <p className="admin-store-card-subtitle">Account details</p>
        <dl className="admin-store-fields">
          <UserField label="Name" value={user.name} />
          <UserField label="Role" value={user.role} />
          <UserField label="User ID" value={user.id} />
          <UserField label="Account created" value={formatDate(user.createdAt)} />
        </dl>
      </section>

      <section className="admin-store-card">
        <h2>Organization</h2>
        <p className="admin-store-card-subtitle">Assigned store or company</p>
        <dl className="admin-store-fields">
          <UserField label="Store or company" value={user.organizationDetail} />
          <UserField label="Account type" value={user.role} />
        </dl>
      </section>

      <section className="admin-store-card admin-store-decision-card">
        <h2>Account status</h2>
        <span className={`admin-store-status admin-user-status-${user.status.toLowerCase()}`}>
          {user.status}
        </span>
        <p className="admin-store-decision-copy">
          {user.status === "Active"
            ? "This user can sign in. Disabling the account keeps their past activity on record."
            : "This user cannot sign in while the account is disabled."}
        </p>
        {user.status === "Active" ? (
          <button
            type="button"
            className="admin-store-action-button admin-store-suspend-button"
            disabled={saving}
            onClick={onDisable}
          >
            Disable user
          </button>
        ) : (
          <button
            type="button"
            className="admin-store-action-button admin-user-enable-button"
            disabled={saving}
            onClick={onEnable}
          >
            {saving ? "Enabling..." : "Enable user"}
          </button>
        )}
      </section>

      <section className="admin-store-card">
        <h2>Contact information</h2>
        <dl className="admin-store-fields">
          <UserField label="Mobile" value={user.mobile} />
          <UserField label="Email" value={user.email} />
        </dl>
      </section>

      <section className="admin-store-card">
        <h2>Sign-in activity</h2>
        <dl className="admin-store-fields">
          <UserField label="Last sign-in" value={formatDateTime(user.lastSignIn)} />
        </dl>
      </section>
    </div>
  </>
);

const UserField = ({ label, value }) => (
  <div className="admin-store-field">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

export default AdminUsers;