import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../Style/Admin/AdminStores.css";
import "../../Style/Admin/AdminUsers.css";

const INITIAL_USERS = [
  {
    id: "iik-administrator",
    name: "IIK Administrator",
    role: "Admin",
    organization: "IIK",
    status: "Active",
    lastSignIn: "13 Nov, 07:55",
    mobile: "011 000 0000",
    email: "admin@iik.co.za",
  },
  {
    id: "sipho-dlamini",
    name: "Sipho Dlamini",
    role: "Store Owner",
    organization: "Mseleku Tuckshop",
    status: "Active",
    lastSignIn: "13 Nov, 08:02",
    mobile: "082 000 0001",
    email: "sipho@example.co.za",
  },
  {
    id: "nomsa-zulu",
    name: "Nomsa Zulu",
    role: "Store Owner",
    organization: "Vusis Tuckshop",
    status: "Active",
    lastSignIn: "13 Nov, 07:40",
    mobile: "082 000 0002",
    email: "nomsa@example.co.za",
  },
  {
    id: "thabo-mkhize",
    name: "Thabo Mkhize",
    role: "Store Owner",
    organization: "Edendale Spaza",
    status: "Active",
    lastSignIn: "12 Nov, 16:20",
    mobile: "082 000 0003",
    email: "thabo@example.co.za",
  },
  {
    id: "lindiwe-ngecobo",
    name: "Lindiwe Ngecobo",
    role: "Store Staff",
    organization: "Mseleku Tuckshop",
    status: "Active",
    lastSignIn: "13 Nov, 08:15",
    mobile: "082 000 0011",
    email: "lindiwe@example.co.za",
  },
  {
    id: "bheki-sithole",
    name: "Bheki Sithole",
    role: "Store Staff",
    organization: "Mseleku Tuckshop",
    status: "Active",
    lastSignIn: "13 Nov, 08:30",
    mobile: "082 000 0012",
    email: "bheki@example.co.za",
  },
  {
    id: "zanele-cele",
    name: "Zanele Cele",
    role: "Store Staff",
    organization: "Mseleku Tuckshop",
    status: "Disabled",
    lastSignIn: "06 Nov, 12:00",
    mobile: "082 000 0013",
    email: "zanele@example.co.za",
  },
  {
    id: "mandla-khumalo",
    name: "Mandla Khumalo",
    role: "Store Staff",
    organization: "Vusis Tuckshop",
    status: "Active",
    lastSignIn: "13 Nov, 08:05",
    mobile: "082 000 0014",
    email: "mandla@example.co.za",
  },
  {
    id: "nandi-mokoena",
    name: "Nandi Mokoena",
    role: "Supplier",
    organization: "Tiger Brands Ltd",
    status: "Active",
    lastSignIn: "13 Nov, 09:00",
    mobile: "011 123 4567",
    email: "nandi@tigerbrands.example",
  },
  {
    id: "pioneer-sales",
    name: "Sales desk",
    role: "Supplier",
    organization: "Pioneer Foods",
    status: "Active",
    lastSignIn: "12 Nov, 14:12",
    mobile: "021 765 4321",
    email: "sales@pioneerfoods.example",
  },
  {
    id: "coastal-contact",
    name: "Pending contact",
    role: "Supplier",
    organization: "Coastal Wholesale (Pty) Ltd",
    status: "Active",
    lastSignIn: "Never",
    mobile: "031 000 0100",
    email: "info@coastal.example",
  },
];

const ROLES = ["All roles", "Admin", "Store Owner", "Store Staff", "Supplier"];
const STATUSES = ["All statuses", "Active", "Disabled"];
const USERS_PER_PAGE = 8;

const AdminUsers = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMobile, setAdminMobile] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.name, user.mobile, user.email]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesRole = role === "All roles" || user.role === role;
    const matchesStatus = status === "All statuses" || user.status === status;
    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const visibleUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);
  const modalUser = modal?.userId ? users.find((user) => user.id === modal.userId) : null;

  const resetFilters = () => setPage(1);

  const updateUserStatus = (userId, nextStatus) => {
    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId ? { ...user, status: nextStatus } : user
    )));
    setModal(null);
  };

  const openAddAdministrator = () => {
    setAdminName("");
    setAdminEmail("");
    setAdminMobile("");
    setModal({ type: "add" });
  };

  const addAdministrator = (event) => {
    event.preventDefault();
    const newAdministrator = {
      id: `admin-${Date.now()}`,
      name: adminName.trim(),
      role: "Admin",
      organization: "IIK",
      status: "Active",
      lastSignIn: "Never",
      mobile: adminMobile.trim(),
      email: adminEmail.trim(),
    };
    setUsers((currentUsers) => [newAdministrator, ...currentUsers]);
    setPage(1);
    setModal(null);
  };

  return (
    <div className="admin-stores-layout">
      <AdminSidebar />

      <main className="admin-stores-main">
        <header className="admin-stores-header">
          <h1>Users</h1>
          <div className="admin-stores-header-actions">
            <button type="button" className="admin-users-add-button" onClick={openAddAdministrator}>
              Add administrator
            </button>
            <span className="admin-stores-avatar" aria-label="Administrator">IA</span>
          </div>
        </header>

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
                    <td>{user.lastSignIn}</td>
                    <td>
                      <div className="admin-store-row-actions">
                        <button
                          type="button"
                          className="admin-store-row-button"
                          onClick={() => setModal({ type: "view", userId: user.id })}
                        >
                          View
                        </button>
                        {user.status === "Active" ? (
                          <button
                            type="button"
                            className="admin-store-row-button admin-user-disable-button"
                            onClick={() => setModal({ type: "disable", userId: user.id })}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-store-row-button admin-user-enable-button"
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
      </main>

      {modal && (
        <div className="admin-store-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}>
          {modal.type === "disable" && modalUser && (
            <section className="admin-store-modal admin-user-disable-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-disable-title">
              <header className="admin-store-modal-header">
                <h2 id="admin-user-disable-title">Disable user?</h2>
                <button type="button" aria-label="Close" onClick={() => setModal(null)}>×</button>
              </header>
              <p className="admin-store-modal-copy">
                Disable {modalUser.name} ({modalUser.role}, {modalUser.organization})? They will not be able to sign in. {modalUser.role === "Store Staff" ? "Their past sales stay on record." : "Their past activity stays on record."}
              </p>
              <p className="admin-store-modal-note admin-user-enable-note">You can enable the user again at any time.</p>
              <div className="admin-store-modal-actions">
                <button
                  type="button"
                  className="admin-store-action-button admin-store-suspend-button"
                  onClick={() => updateUserStatus(modalUser.id, "Disabled")}
                >
                  Disable user
                </button>
                <button type="button" className="admin-store-action-button admin-store-cancel-button" onClick={() => setModal(null)}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {modal.type === "view" && modalUser && (
            <section className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-view-title">
              <header className="admin-store-modal-header">
                <h2 id="admin-user-view-title">{modalUser.name}</h2>
                <button type="button" aria-label="Close" onClick={() => setModal(null)}>×</button>
              </header>
              <dl className="admin-user-details">
                <div><dt>Role</dt><dd>{modalUser.role}</dd></div>
                <div><dt>Store or company</dt><dd>{modalUser.organization}</dd></div>
                <div><dt>Status</dt><dd>{modalUser.status}</dd></div>
                <div><dt>Mobile</dt><dd>{modalUser.mobile}</dd></div>
                <div><dt>Email</dt><dd>{modalUser.email}</dd></div>
                <div><dt>Last sign-in</dt><dd>{modalUser.lastSignIn}</dd></div>
              </dl>
              <button type="button" className="admin-store-action-button admin-store-approve-button admin-user-view-close" onClick={() => setModal(null)}>
                Close
              </button>
            </section>
          )}

          {modal.type === "add" && (
            <form className="admin-store-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-add-title" onSubmit={addAdministrator}>
              <header className="admin-store-modal-header">
                <h2 id="admin-user-add-title">Add administrator</h2>
                <button type="button" aria-label="Close" onClick={() => setModal(null)}>×</button>
              </header>
              <label className="admin-store-modal-field">
                Full name
                <input required value={adminName} onChange={(event) => setAdminName(event.target.value)} />
              </label>
              <label className="admin-store-modal-field">
                Email
                <input required type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
              </label>
              <label className="admin-store-modal-field">
                Mobile
                <input required type="tel" value={adminMobile} onChange={(event) => setAdminMobile(event.target.value)} />
              </label>
              <div className="admin-store-modal-actions">
                <button type="submit" className="admin-store-action-button admin-store-approve-button">
                  Add administrator
                </button>
                <button type="button" className="admin-store-action-button admin-store-cancel-button" onClick={() => setModal(null)}>
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

export default AdminUsers;