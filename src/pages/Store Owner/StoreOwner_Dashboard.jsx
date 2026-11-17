import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import Sidebar from "../../components/StoreOwner/Sidebar";
import Logo from "../../assets/images/IIK logo.png";
import "../../Style/Store Owner/StoreOwner_Dashboard.css";

// Chart data
const salesData = [
  { day: "Sat", amount: 1420 },
  { day: "Sun", amount: 1690 },
  { day: "Mon", amount: 1250 },
  { day: "Tue", amount: 1980 },
  { day: "Wed", amount: 2210 },
  { day: "Thu", amount: 2640 },
  { day: "Fri", amount: 1842 },
];

const Dashboard = () => {
  return (
    <div className="app-layout">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <div className="brand-logo-wrap">
              <img src={Logo} alt="IIK Organisation logo" className="brand-logo" />
            </div>
            <div className="header-title">
              <h2>Dashboard</h2>
              <p>Mseleku Tuckshop • Friday 13 November 2026</p>
            </div>
          </div>
          
          <div className="header-right">
            <span className="sync-status">Synced 2 min ago</span>
            <button className="btn-primary">Record sale</button>
            <button className="btn-secondary">Stock in</button>
            <button className="btn-secondary">Request stock</button>
            <div className="avatar-user">SD</div>
          </div>
        </header>

        {/* Alert Banners */}
        <div className="alert-banners">
          <div className="alert alert-danger">
            3 products are below their reorder level. Review stock
          </div>
          <div className="alert alert-info">
            New supplier quote received for Rice, 100 kg
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="stat-cards-grid">
          <div className="stat-card">
            <span className="stat-label">Sales today</span>
            <h3 className="stat-value">R1,842.50</h3>
            <span className="stat-sub">Sample data</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Transactions today</span>
            <h3 className="stat-value">37</h3>
            <span className="stat-sub">Avg R49.80</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Inventory value</span>
            <h3 className="stat-value">R74,517</h3>
            <span className="stat-sub">52 products</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low stock</span>
            <h3 className="stat-value text-danger">3</h3>
            <span className="stat-sub">Below reorder level</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Open requests</span>
            <h3 className="stat-value">2</h3>
            <span className="stat-sub">1 with new quote</span>
          </div>
        </div>

        {/* Middle Row: Chart & Top Selling */}
        <div className="dashboard-row">
          {/* Sales Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <h3>Sales, last 7 days</h3>
              <button className="btn-outline">View sales report</button>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? "#000" : "#d1d5db"} />
                    ))}
                    <LabelList
                      dataKey="amount"
                      position="top"
                      formatter={(value) => `R${Number(value).toLocaleString()}`}
                      fill="#111827"
                      fontSize={10}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling */}
          <div className="card top-selling-card">
            <div className="card-header">
              <h3>Top-selling today</h3>
            </div>
            <ul className="top-selling-list">
              <li>
                <span>Coca-Cola 500ml</span>
                <strong>48 sold</strong>
              </li>
              <li>
                <span>Simba Chips Original</span>
                <strong>35 sold</strong>
              </li>
              <li>
                <span>White Star Maize Meal 2.5kg</span>
                <strong>21 sold</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row: Low Stock & Staff */}
        <div className="dashboard-row">
          {/* Low Stock */}
          <div className="card">
            <div className="card-header">
              <h3>Low stock</h3>
              <button className="btn-outline">Open inventory</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>In stock</th>
                  <th>Reorder</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rama Margarine 500g</td>
                  <td>0</td>
                  <td>6</td>
                  <td><span className="status-pill status-danger">Out of stock</span></td>
                </tr>
                <tr>
                  <td>Clover Fresh Milk 1L</td>
                  <td>9</td>
                  <td>15</td>
                  <td><span className="status-pill status-warning">Low</span></td>
                </tr>
                <tr>
                  <td>Sasko Premium Bread</td>
                  <td>12</td>
                  <td>15</td>
                  <td><span className="status-pill status-warning">Low</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Staff */}
          <div className="card">
            <div className="card-header">
              <h3>Staff</h3>
              <button className="btn-outline">Add staff</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sipho Dlamini</td>
                  <td>Cashier</td>
                  <td><span className="status-pill status-neutral">Active</span></td>
                </tr>
                <tr>
                  <td>Nomsa Zulu</td>
                  <td>Stock clerk</td>
                  <td><span className="status-pill status-neutral">Active</span></td>
                </tr>
                <tr>
                  <td>Thabo Mkhize</td>
                  <td>Cashier</td>
                  <td><span className="status-pill status-danger">Disabled</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Procurement Network */}
        <div className="card">
          <div className="card-header">
            <h3>Procurement network</h3>
            <button className="btn-outline">New Request</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>My request</th>
                <th>Combined demand</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rice</td>
                <td>50 kg</td>
                <td>100 kg (3 stores)</td>
                <td><span className="status-pill status-info">2 quotes</span></td>
              </tr>
              <tr>
                <td>Sunflower oil</td>
                <td>20 L</td>
                <td>60 L (4 stores)</td>
                <td><span className="status-pill status-neutral">Pending</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
