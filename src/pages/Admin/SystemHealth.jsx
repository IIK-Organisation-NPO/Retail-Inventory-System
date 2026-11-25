import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/SystemHealth.css";

const SYNC_DATA = {
  Today: [
    { day: "00–04", value: 96 },
    { day: "04–08", value: 98 },
    { day: "08–12", value: 97 },
    { day: "12–16", value: 99 },
    { day: "16–20", value: 97 },
    { day: "20–24", value: 98 },
  ],
  "Last 7 days": [
    { day: "Sat", value: 96 },
    { day: "Sun", value: 98 },
    { day: "Mon", value: 97 },
    { day: "Tue", value: 99 },
    { day: "Wed", value: 97 },
    { day: "Thu", value: 98 },
    { day: "Fri", value: 97 },
  ],
  "Last 30 days": [
    { day: "Sat", value: 96 },
    { day: "Sun", value: 98 },
    { day: "Mon", value: 97 },
    { day: "Tue", value: 99 },
    { day: "Wed", value: 97 },
    { day: "Thu", value: 98 },
    { day: "Fri", value: 97 },
  ],
};

const SERVICES = ["Web app", "API", "Database", "Email sending"];

const SystemHealth = () => {
  const [selectedRange, setSelectedRange] = useState("Last 30 days");
  const syncData = SYNC_DATA[selectedRange];
  const maximum = Math.max(...syncData.map((item) => item.value));

  return (
    <div className="admin-health-layout">
      <AdminSidebar />

      <main className="admin-health-main">
        <header className="admin-health-header">
          <h1>System health</h1>
          <AdminUserMenu />
        </header>

        <section className="admin-health-metrics" aria-label="System health metrics">
          <article className="admin-health-metric">
            <span>Uptime, {selectedRange.toLowerCase()}</span>
            <strong>99.9%</strong>
            <div className="admin-health-progress" role="progressbar" aria-label="Uptime" aria-valuemin="0" aria-valuemax="100" aria-valuenow="99.9">
              <span style={{ width: "99.9%" }} />
            </div>
            <small>Target 99% · Updated 5 min ago</small>
          </article>
          <article className="admin-health-metric">
            <span>Sync success</span>
            <strong>97.5%</strong>
            <div className="admin-health-progress" role="progressbar" aria-label="Sync success" aria-valuemin="0" aria-valuemax="100" aria-valuenow="97.5">
              <span style={{ width: "97.5%" }} />
            </div>
            <small>Target 95% · Updated 5 min ago</small>
          </article>
          <article className="admin-health-metric">
            <span>Average page load</span>
            <strong>1.8 s</strong>
            <div className="admin-health-progress" role="progressbar" aria-label="Average page load" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60">
              <span style={{ width: "60%" }} />
            </div>
            <small>Target under 3 s · Updated 5 min ago</small>
          </article>
          <article className="admin-health-metric">
            <span>Last backup</span>
            <strong>Today, 02:00</strong>
            <div className="admin-health-progress" role="progressbar" aria-label="Backup retention" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
              <span style={{ width: "100%" }} />
            </div>
            <small>Daily, kept 30 days</small>
          </article>
        </section>

        <div className="admin-health-context">
          <p>These figures come from Azure Monitor and cover the period you choose. Sample values here.</p>
          <div className="admin-health-period-controls" role="group" aria-label="Health reporting period">
            {Object.keys(SYNC_DATA).map((range) => (
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

        <div className="admin-health-middle">
          <section className="admin-health-panel admin-health-chart-panel">
            <h2>Sync success per day (%)</h2>
            <div
              className="admin-health-chart"
              role="img"
              aria-label={`Sync success per day, ${selectedRange}`}
              style={{ gridTemplateColumns: `repeat(${syncData.length}, minmax(0, 1fr))` }}
            >
              {syncData.map((item, index) => (
                <div className="admin-health-chart-column" key={item.day}>
                  <span className="admin-health-chart-value">{item.value}%</span>
                  <div className="admin-health-bar-area">
                    <span
                      className={`admin-health-bar${index === syncData.length - 1 ? " latest" : ""}`}
                      style={{ height: `${(item.value / maximum) * 100}%` }}
                    />
                  </div>
                  <span className="admin-health-chart-day">{item.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-health-panel admin-health-failures-panel">
            <h2>Failed syncs to look at</h2>
            <div className="admin-health-table-scroll">
              <table className="admin-health-table">
                <thead>
                  <tr>
                    <th scope="col">Store</th>
                    <th scope="col">Items</th>
                    <th scope="col">Last try</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Mseleku Tuckshop</td>
                    <td>1 stock adjustment</td>
                    <td>13 Nov, 12:30</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>The phone keeps trying again. Contact the store if it stays here.</p>
          </section>
        </div>

        <section className="admin-health-panel admin-health-services-panel">
          <h2>Service status</h2>
          <div className="admin-health-table-scroll">
            <table className="admin-health-table">
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((service) => (
                  <tr key={service}>
                    <td>{service}</td>
                    <td><span className="admin-health-running">Running</span></td>
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

export default SystemHealth;