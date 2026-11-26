import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminDashboard.css";

const METRICS = [
  { label: "Stores onboarded", value: "2", note: "Target 100", progress: 2 },
  { label: "Active users", value: "10", note: "Target 250 a month", progress: 4 },
  { label: "Transactions today", value: "66", note: "Target 10,000 a day", progress: 1 },
  { label: "System uptime", value: "99.9%", note: "Target 99% · Updated 5 min ago", progress: 99.9 },
  { label: "Sync success", value: "97.5%", note: "Target 95% · Updated 5 min ago", progress: 97.5 },
  { label: "Average page load", value: "1.8 s", note: "Target under 3 s · Updated 5 min ago", progress: 60 },
];

const ACTIVITY = [
  { time: "13 Nov, 08:15", user: "Lindiwe Ngecobo", event: "Login", details: "082 000 0011" },
  { time: "13 Nov, 08:02", user: "Sipho Dlamini", event: "Login", details: "sipho@gmail.com" },
  { time: "12 Nov, 17:40", user: "Sipho Dlamini", event: "Stock adjustment", details: "Sprite 500ml, Mseleku Tuckshop: 60 to 58" },
  { time: "12 Nov, 10:05", user: "Sipho Dlamini", event: "Price change", details: "Coca-Cola 500ml selling price updated" },
];

const WAITING_APPLICATIONS = [
  { applicant: "Edendale Spaza", type: "Store", sent: "12 Nov", to: "/admin/stores?store=edendale-spaza" },
  { applicant: "Coastal Wholesale (Pty) Ltd", type: "Supplier", sent: "13 Nov", to: "/admin/suppliers?supplier=coastal-wholesale" },
];

const CHART_DATA = {
  Today: [
    { day: "00–04", value: 4 },
    { day: "04–08", value: 8 },
    { day: "08–12", value: 18 },
    { day: "12–16", value: 16 },
    { day: "16–20", value: 13 },
    { day: "20–24", value: 7 },
  ],
  "Last 7 days": [
    { day: "Sat", value: 55 },
    { day: "Sun", value: 62 },
    { day: "Mon", value: 48 },
    { day: "Tue", value: 71 },
    { day: "Wed", value: 74 },
    { day: "Thu", value: 64 },
    { day: "Fri", value: 66 },
  ],
  "Last 30 days": [
    { day: "1–4", value: 55 },
    { day: "5–8", value: 62 },
    { day: "9–12", value: 48 },
    { day: "13–16", value: 71 },
    { day: "17–20", value: 74 },
    { day: "21–24", value: 64 },
    { day: "25–30", value: 66 },
  ],
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState("Last 30 days");
  const chartData = CHART_DATA[selectedRange];
  const chartMaximum = Math.max(...chartData.map((item) => item.value));

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-dashboard-main">
        <header className="admin-dashboard-header">
          <h1>Dashboard</h1>
          <AdminUserMenu />
        </header>

        <p className="admin-review-notice">
          2 applications are waiting for your review: 1 store and 1 supplier.
        </p>

        <div className="admin-dashboard-context">
          <p>Uptime, sync and page-load come from Azure Monitor and cover the period you choose. Sample values here.</p>
          <div className="admin-period-controls" role="group" aria-label="Dashboard reporting period">
            {Object.keys(CHART_DATA).map((range) => (
              <button
                type="button"
                key={range}
                className={selectedRange === range ? "active" : ""}
                aria-pressed={selectedRange === range}
                onClick={() => setSelectedRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <section className="admin-metrics-grid" aria-label="Key metrics">
          {METRICS.map((metric) => (
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
            <h2>Transactions, {selectedRange.toLowerCase()}</h2>
            <div
              className="admin-transactions-chart"
              role="img"
              aria-label={`Transactions ${selectedRange}`}
              style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
            >
              {chartData.map((item, index) => (
                <div className="admin-chart-column" key={item.day}>
                  <span className="admin-chart-value">{item.value}</span>
                  <div className="admin-chart-bar-area">
                    <span
                      className={`admin-chart-bar${index === chartData.length - 1 ? " latest" : ""}`}
                      style={{ height: `${Math.max((item.value / chartMaximum) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="admin-chart-day">{item.day}</span>
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
                    <th scope="col"><span className="admin-visually-hidden">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {WAITING_APPLICATIONS.map((application) => (
                    <tr key={application.applicant}>
                      <td>{application.applicant}</td>
                      <td>{application.type}</td>
                      <td>{application.sent}</td>
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
                  ))}
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
                {ACTIVITY.map((activity) => (
                  <tr key={`${activity.time}-${activity.user}`}>
                    <td>{activity.time}</td>
                    <td>{activity.user}</td>
                    <td>{activity.event}</td>
                    <td>{activity.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

    </div>
  );
};

export default AdminDashboard;