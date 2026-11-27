import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminDashboard.css";

// Change this to match how your other admin pages reach the backend.
const API_BASE = "http://localhost:5000";

// Button label -> value sent to the backend (?range=)
const RANGES = [
  { label: "Today", key: "today" },
  { label: "Last 7 days", key: "7" },
  { label: "Last 30 days", key: "30" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const formatDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// How full the progress bar is, between 0 and 100.
const percentOf = (value, target) => {
  if (value === null || value === undefined || !target) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
};

// Builds the six cards from the backend's metrics object.
const buildMetrics = (m) => {
  const storesValue = m.storesOnboarded.value;
  const usersValue = m.activeUsers.value;
  const transactionsValue = m.transactionsToday.value;
  const syncValue = m.syncSuccess.value;

  return [
    {
      label: "Stores onboarded",
      value: String(storesValue),
      note: `Target ${m.storesOnboarded.target}`,
      progress: percentOf(storesValue, m.storesOnboarded.target),
    },
    {
      label: "Active users",
      value: String(usersValue),
      note: `Active accounts · Target ${m.activeUsers.target}`,
      progress: percentOf(usersValue, m.activeUsers.target),
    },
    {
      label: "Transactions today",
      value: transactionsValue.toLocaleString("en-ZA"),
      note: `Target ${m.transactionsToday.target.toLocaleString("en-ZA")} a day`,
      progress: percentOf(transactionsValue, m.transactionsToday.target),
    },
    {
      label: "System uptime",
      value: "—",
      note: "Not connected yet · Azure Monitor",
      progress: 0,
    },
    {
      label: "Sync success",
      value: syncValue === null ? "—" : `${syncValue}%`,
      note:
        syncValue === null
          ? "No sync records for this period"
          : `Target ${m.syncSuccess.target}% · This period`,
      progress: syncValue === null ? 0 : Math.min(100, syncValue),
    },
    {
      label: "Average page load",
      value: "—",
      note: "Not connected yet · Azure Monitor",
      progress: 0,
    },
  ];
};

const reviewNotice = (waiting) => {
  if (!waiting || waiting.total === 0) {
    return "No applications are waiting for your review.";
  }
  const parts = [];
  if (waiting.stores > 0) parts.push(`${waiting.stores} store${waiting.stores === 1 ? "" : "s"}`);
  if (waiting.suppliers > 0) {
    parts.push(`${waiting.suppliers} supplier${waiting.suppliers === 1 ? "" : "s"}`);
  }
  const verb = waiting.total === 1 ? "application is" : "applications are";
  return `${waiting.total} ${verb} waiting for your review: ${parts.join(" and ")}.`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState(RANGES[2]); // Last 30 days
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE}/api/admin/dashboard?range=${selectedRange.key}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || "Could not load the dashboard.");
        }
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [selectedRange]);

  const metrics = data ? buildMetrics(data.metrics) : [];
  const chartData = data ? data.chart : [];
  const chartMaximum = Math.max(...chartData.map((item) => item.value), 1);
  const waitingItems = data ? data.waiting.items : [];
  const activity = data ? data.activity : [];

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-dashboard-main">
        <header className="admin-dashboard-header">
          <h1>Dashboard</h1>
          <AdminUserMenu />
        </header>

        {error && (
          <p role="alert" style={{ color: "#c0392b", margin: "0 0 12px" }}>
            {error}
          </p>
        )}

        {data && <p className="admin-review-notice">{reviewNotice(data.waiting)}</p>}

        <div className="admin-dashboard-context">
          <p>
            Stores, users, transactions, sync and activity are live. Uptime and page load will come
            from Azure Monitor once it is connected.
          </p>
          <div className="admin-period-controls" role="group" aria-label="Dashboard reporting period">
            {RANGES.map((range) => (
              <button
                type="button"
                key={range.key}
                className={selectedRange.key === range.key ? "active" : ""}
                aria-pressed={selectedRange.key === range.key}
                onClick={() => setSelectedRange(range)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {!data && loading && <p>Loading dashboard…</p>}

        {data && (
          <>
            <section className="admin-metrics-grid" aria-label="Key metrics">
              {metrics.map((metric) => (
                <article className="admin-metric-card" key={metric.label}>
                  <span className="admin-metric-label">{metric.label}</span>
                  <strong className="admin-metric-value">{metric.value}</strong>
                  <div
                    className="admin-metric-progress"
                    role="progressbar"
                    aria-label={`${metric.label} progress`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={metric.progress}
                  >
                    <span style={{ width: `${metric.progress}%` }} />
                  </div>
                  <span className="admin-metric-note">{metric.note}</span>
                </article>
              ))}
            </section>

            <div className="admin-dashboard-middle">
              <section className="admin-dashboard-card admin-transactions-card">
                <h2>Transactions, {selectedRange.label.toLowerCase()}</h2>
                <div
                  className="admin-transactions-chart"
                  role="img"
                  aria-label={`Transactions ${selectedRange.label}`}
                  style={{
                    gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`,
                  }}
                >
                  {chartData.map((item, index) => (
                    <div className="admin-chart-column" key={item.label}>
                      <span className="admin-chart-value">{item.value}</span>
                      <div className="admin-chart-bar-area">
                        <span
                          className={`admin-chart-bar${index === chartData.length - 1 ? " latest" : ""}`}
                          style={{
                            height: `${Math.max((item.value / chartMaximum) * 100, 8)}%`,
                          }}
                        />
                      </div>
                      <span className="admin-chart-day">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-dashboard-card admin-review-card">
                <h2>Waiting for review</h2>
                <div className="admin-table-scroll">
                  <table className="admin-dashboard-table">
                    <thead>
                      <tr>
                        <th scope="col">Applicant</th>
                        <th scope="col">Type</th>
                        <th scope="col">Sent</th>
                        <th scope="col">
                          <span className="admin-visually-hidden">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitingItems.length === 0 ? (
                        <tr>
                          <td colSpan={4}>Nothing is waiting for review.</td>
                        </tr>
                      ) : (
                        waitingItems.map((application) => (
                          <tr key={application.id}>
                            <td>{application.applicant}</td>
                            <td>{application.type}</td>
                            <td>{formatDate(application.sent)}</td>
                            <td>
                              <button
                                type="button"
                                className="admin-dashboard-link"
                                onClick={() => navigate(application.to)}
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="admin-dashboard-card admin-activity-card">
              <div className="admin-activity-header">
                <h2>Recent activity</h2>
                <button
                  type="button"
                  className="admin-dashboard-audit-button"
                  onClick={() => navigate("/admin/audit-log")}
                >
                  Open audit log
                </button>
              </div>
              <div className="admin-table-scroll">
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">User</th>
                      <th scope="col">Event</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No activity recorded yet.</td>
                      </tr>
                    ) : (
                      activity.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.time)}</td>
                          <td>{item.user}</td>
                          <td>{item.event}</td>
                          <td>{item.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;