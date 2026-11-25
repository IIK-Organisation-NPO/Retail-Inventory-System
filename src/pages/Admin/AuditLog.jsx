import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AuditLog.css";

const AUDIT_EVENTS = [
  {
    time: "13 Nov, 08:15",
    user: "Lindiwe Ngecobo",
    action: "Login",
    details: "082 000 0011",
    daysAgo: 0,
  },
  {
    time: "13 Nov, 08:02",
    user: "Sipho Dlamini",
    action: "Login",
    details: "sipho@gmail.com",
    daysAgo: 0,
  },
  {
    time: "12 Nov, 17:40",
    user: "Sipho Dlamini",
    action: "Stock adjustment",
    details: "Sprite 500ml, Mseleku Tuckshop: 60 to 58",
    daysAgo: 1,
  },
  {
    time: "12 Nov, 10:05",
    user: "Sipho Dlamini",
    action: "Price change",
    details: "Coca-Cola 500ml selling price updated",
    daysAgo: 1,
  },
  {
    time: "11 Nov, 09:30",
    user: "Sipho Dlamini",
    action: "User administration",
    details: "Disabled user Zanele Cele",
    daysAgo: 2,
  },
  {
    time: "10 Nov, 14:00",
    user: "Thabo Mkhize",
    action: "User administration",
    details: "Store application submitted: Edendale Spaza",
    daysAgo: 3,
  },
];

const TOTAL_LOG_ENTRIES = 214;
const EVENT_TYPES = [...new Set(AUDIT_EVENTS.map((event) => event.action))];
const USERS = [...new Set(AUDIT_EVENTS.map((event) => event.user))];

const AuditLog = () => {
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("All events");
  const [dateRange, setDateRange] = useState("7");
  const [user, setUser] = useState("All users");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredEvents = AUDIT_EVENTS.filter((event) => {
    const matchesSearch = [event.user, event.action, event.details]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesEvent = eventType === "All events" || event.action === eventType;
    const matchesDate = dateRange === "all" || event.daysAgo < Number(dateRange);
    const matchesUser = user === "All users" || event.user === user;

    return matchesSearch && matchesEvent && matchesDate && matchesUser;
  });

  const exportEvents = () => {
    const rows = [
      ["Time", "User", "Action", "Details"],
      ...filteredEvents.map(({ time, user: eventUser, action, details }) => [
        time,
        eventUser,
        action,
        details,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-log.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="admin-audit-layout">
      <AdminSidebar />

      <main className="admin-audit-main">
        <header className="admin-audit-header">
          <h1>Audit log</h1>
          <div className="admin-audit-header-actions">
            <button type="button" className="admin-audit-export" onClick={exportEvents}>
              Export
            </button>
            <AdminUserMenu />
          </div>
        </header>

        <div className="admin-audit-filters">
          <label className="admin-audit-search">
            <span className="admin-audit-visually-hidden">Search by user or detail</span>
            <input
              type="search"
              placeholder="Search by user or detail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            <span className="admin-audit-visually-hidden">Filter by event</span>
            <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option>All events</option>
              {EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span className="admin-audit-visually-hidden">Filter by date range</span>
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <label>
            <span className="admin-audit-visually-hidden">Filter by user</span>
            <select value={user} onChange={(event) => setUser(event.target.value)}>
              <option>All users</option>
              {USERS.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
        </div>

        <section className="admin-audit-card">
          <h2>Activity on the platform</h2>
          <div className="admin-audit-table-scroll">
            <table className="admin-audit-table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">User</th>
                  <th scope="col">Action</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={`${event.time}-${event.user}-${event.action}`}>
                    <td>{event.time}</td>
                    <td>{event.user}</td>
                    <td>{event.action}</td>
                    <td>{event.details}</td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td className="admin-audit-empty" colSpan="4">No activity matches these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="admin-audit-note">
            Logged: sign-ins, stock adjustments, price changes and user administration.
            {" "}Showing {filteredEvents.length} of {TOTAL_LOG_ENTRIES} entries.
          </p>
        </section>
      </main>
    </div>
  );
};

export default AuditLog;