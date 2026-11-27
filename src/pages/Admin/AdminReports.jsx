import { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminReports.css";

const API_URL = "http://localhost:5000/api";

// Procurement is not connected to the backend yet, so it stays sample data.
const PROCUREMENT_DATA = {
  metrics: [
    { label: "Requests, last 7 days", value: "42" },
    { label: "Quotes received", value: "128" },
    { label: "Average response time", value: "2.4 hrs" },
    { label: "Orders placed", value: "18" },
  ],
  chartTitle: "Requests per day, all stores",
  chart: [
    { day: "Sat", value: 4, label: "4" },
    { day: "Sun", value: 7, label: "7" },
    { day: "Mon", value: 5, label: "5" },
    { day: "Tue", value: 6, label: "6" },
    { day: "Wed", value: 8, label: "8" },
    { day: "Thu", value: 5, label: "5" },
    { day: "Fri", value: 7, label: "7" },
  ],
  highlightIndex: 4,
  breakdownTitle: "Requests by store, last 7 days",
  breakdown: [
    { name: "Mseleku Tuckshop", value: "24 requests", progress: 100 },
    { name: "Vusis Tuckshop", value: "18 requests", progress: 75 },
    { name: "Edendale Spaza", value: "Not live yet", progress: 0 },
  ],
  breakdownNote: "42 requests across 2 active stores",
  summaryTitle: "Procurement summary",
  summary: [
    { measure: "Demand requests this month", now: "126", target: "150" },
    { measure: "Quotes received", now: "128", target: "150+" },
    { measure: "Quote response rate", now: "86%", target: "90%" },
    { measure: "Orders placed", now: "18", target: "30" },
  ],
};

const TABS = ["Platform", "Procurement"];

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("Platform");
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPlatform = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/admin/reports?type=Platform`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Could not load the report.");
        }
        if (!cancelled) setPlatform(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load the report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPlatform();
    return () => {
      cancelled = true;
    };
  }, []);

  const report = activeTab === "Platform" ? platform : PROCUREMENT_DATA;

  const exportReport = () => {
    if (!report) return;
    const rows = [
      ["Measure", "Now", "Target"],
      ...report.summary.map(({ measure, now, target }) => [measure, now, target]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab.toLowerCase()}-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const renderReport = () => {
    if (activeTab === "Platform" && loading) {
      return <p className="admin-report-breakdown-note">Loading report...</p>;
    }
    if (activeTab === "Platform" && error) {
      return <p style={{ color: "#c62828" }}>{error}</p>;
    }
    if (!report) return null;

    const chartMaximum = Math.max(...report.chart.map((item) => item.value), 1);

    return (
      <>
        {activeTab === "Procurement" && (
          <p className="admin-report-breakdown-note">
            Sample data. Procurement is not connected to the database yet.
          </p>
        )}

        <section className="admin-reports-metrics" aria-label={`${activeTab} key metrics`}>
          {report.metrics.map((metric) => (
            <article className="admin-report-metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <div className="admin-reports-middle">
          <section className="admin-report-panel admin-report-chart-panel">
            <h2>{report.chartTitle}</h2>
            <div className="admin-report-chart" role="img" aria-label={report.chartTitle}>
              {report.chart.map((item, index) => (
                <div className="admin-report-chart-column" key={`${item.day}-${index}`}>
                  <span className="admin-report-chart-value">{item.label}</span>
                  <div className="admin-report-bar-area">
                    <span
                      className={`admin-report-bar${index === report.highlightIndex ? " latest" : ""}`}
                      style={{ height: `${Math.max((item.value / chartMaximum) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="admin-report-chart-day">{item.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-report-panel admin-report-breakdown-panel">
            <h2>{report.breakdownTitle}</h2>
            <ul className="admin-report-breakdown">
              {report.breakdown.map((item) => (
                <li key={item.name}>
                  <div className="admin-report-breakdown-heading">
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="admin-report-breakdown-track">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="admin-report-breakdown-note">{report.breakdownNote}</p>
          </section>
        </div>

        <section className="admin-report-panel admin-report-summary-panel">
          <div className="admin-report-summary-header">
            <h2>{report.summaryTitle}</h2>
            <button type="button" className="admin-report-export" onClick={exportReport}>
              Export
            </button>
          </div>
          <div className="admin-report-table-scroll">
            <table className="admin-report-table">
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col">Now</th>
                  <th scope="col">Target</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.map((item) => (
                  <tr key={item.measure}>
                    <td>{item.measure}</td>
                    <td>{item.now}</td>
                    <td>{item.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="admin-reports-layout">
      <AdminSidebar />

      <main className="admin-reports-main">
        <header className="admin-reports-header">
          <h1>Reports</h1>
          <AdminUserMenu />
        </header>

        <div className="admin-reports-tabs" role="tablist" aria-label="Report type">
          {TABS.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {renderReport()}
      </main>
    </div>
  );
};

export default AdminReports;