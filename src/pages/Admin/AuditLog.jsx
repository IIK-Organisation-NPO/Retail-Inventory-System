import { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AuditLog.css";

const API_URL = "http://localhost:5000/api";
const PAGE_SIZE = 20;

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFullDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const request = async (path) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fieldError = data.errors && Object.values(data.errors)[0];
    throw new Error(fieldError || data.message || "Something went wrong.");
  }
  return data;
};

const buildParams = ({ search, action, user, range }) => {
  const params = new URLSearchParams();
  params.set("range", range);
  if (search) params.set("search", search);
  if (action !== "all") params.set("action", action);
  if (user !== "all") params.set("user", user);
  return params;
};

const errorStyle = { color: "#c62828", margin: "8px 0" };

const AuditLog = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOptions, setFilterOptions] = useState({ actions: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [eventType, setEventType] = useState("all");
  const [dateRange, setDateRange] = useState("7");
  const [user, setUser] = useState("all");
  const [page, setPage] = useState(1);

  // Wait until the person stops typing before asking the server.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const params = buildParams({
          search: debouncedSearch,
          action: eventType,
          user,
          range: dateRange,
        });
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        const data = await request(`/admin/audit-log?${params.toString()}`);
        if (cancelled) return;
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setTotalEntries(data.totalEntries || 0);
        setTotalPages(data.totalPages || 1);
        setFilterOptions(data.filters || { actions: [], users: [] });
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load the audit log.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, eventType, dateRange, user, page]);

  const exportEvents = async () => {
    try {
      setExporting(true);
      setError("");
      const params = buildParams({
        search: debouncedSearch,
        action: eventType,
        user,
        range: dateRange,
      });
      params.set("export", "true");

      const data = await request(`/admin/audit-log?${params.toString()}`);
      const rows = [
        ["Time", "User", "Action", "Details"],
        ...(data.events || []).map((event) => [
          formatFullDateTime(event.time),
          event.user,
          event.action,
          event.details,
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
    } catch (err) {
      setError(err.message || "Could not export the audit log.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-audit-layout">
      <AdminSidebar />

      <main className="admin-audit-main">
        <header className="admin-audit-header">
          <h1>Audit log</h1>
          <div className="admin-audit-header-actions">
            <button
              type="button"
              className="admin-audit-export"
              disabled={exporting}
              onClick={exportEvents}
            >
              {exporting ? "Exporting..." : "Export"}
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
            <select
              value={eventType}
              onChange={(event) => {
                setEventType(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All events</option>
              {filterOptions.actions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="admin-audit-visually-hidden">Filter by date range</span>
            <select
              value={dateRange}
              onChange={(event) => {
                setDateRange(event.target.value);
                setPage(1);
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <label>
            <span className="admin-audit-visually-hidden">Filter by user</span>
            <select
              value={user}
              onChange={(event) => {
                setUser(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All users</option>
              {filterOptions.users.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <section className="admin-audit-card">
          <h2>Activity on the platform</h2>
          {error && <p role="alert" style={errorStyle}>{error}</p>}
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
                {loading && (
                  <tr>
                    <td className="admin-audit-empty" colSpan="4">Loading activity...</td>
                  </tr>
                )}
                {!loading && events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.time)}</td>
                    <td>{event.user}</td>
                    <td>{event.action}</td>
                    <td>{event.details}</td>
                  </tr>
                ))}
                {!loading && events.length === 0 && (
                  <tr>
                    <td className="admin-audit-empty" colSpan="4">No activity matches these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <p className="admin-audit-note">
              Logged: store approvals, rejections and suspensions, and user enabling and disabling.
              {" "}Showing {events.length} of {total} entries
              {total !== totalEntries ? ` (${totalEntries} in the whole log)` : ""}.
            </p>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-audit-export"
                  disabled={page === 1 || loading}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  type="button"
                  className="admin-audit-export"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuditLog;