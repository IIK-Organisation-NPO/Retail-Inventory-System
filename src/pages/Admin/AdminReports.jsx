import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import "../../Style/Admin/AdminReports.css";

const REPORT_DATA = {
  Platform: {
    metrics: [
      { label: "Sales, last 7 days", value: "R22,902.50" },
      { label: "Transactions", value: "440" },
      { label: "Average sale", value: "R52.05" },
      { label: "Active stores", value: "2" },
    ],
    chartTitle: "Sales per day, all stores (R)",
    chart: [
      { day: "Sat", value: 3010, label: "R3,010" },
      { day: "Sun", value: 3480, label: "R3,480" },
      { day: "Mon", value: 2640, label: "R2,640" },
      { day: "Tue", value: 3590, label: "R3,590" },
      { day: "Wed", value: 3950, label: "R3,950" },
      { day: "Thu", value: 3003, label: "R3,003" },
      { day: "Fri", value: 3229, label: "R3,229" },
    ],
    highlightIndex: 4,
    breakdownTitle: "Sales by store, last 7 days",
    breakdown: [
      { name: "Mseleku Tuckshop", value: "R13,032.50", progress: 100 },
      { name: "Vusis Tuckshop", value: "R9,870.00", progress: 76 },
      { name: "Edendale Spaza", value: "Not live yet", progress: 0 },
    ],
    breakdownNote: "13,032.50 + 9,870.00 = 22,902.50",
    summaryTitle: "Platform summary",
    summary: [
      { measure: "Stores onboarded", now: "2", target: "100" },
      { measure: "Active users this month", now: "10", target: "250+" },
      { measure: "Transactions a day", now: "66", target: "10,000+" },
      { measure: "User retention", now: "Measured after the first month", target: "80%" },
    ],
  },
  Procurement: {
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
  },
};

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("Platform");
  const report = REPORT_DATA[activeTab];
  const chartMaximum = Math.max(...report.chart.map((item) => item.value));

  const exportReport = () => {
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

  return (
    <div className="admin-reports-layout">
      <AdminSidebar />

      <main className="admin-reports-main">
        <header className="admin-reports-header">
          <h1>Reports</h1>
          <span className="admin-reports-avatar" aria-label="Administrator">IA</span>
        </header>

        <div className="admin-reports-tabs" role="tablist" aria-label="Report type">
          {Object.keys(REPORT_DATA).map((tab) => (
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
                <div className="admin-report-chart-column" key={item.day}>
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
            <button type="button" className="admin-report-export" onClick={exportReport}>Export</button>
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
      </main>
    </div>
  );
};

export default AdminReports;