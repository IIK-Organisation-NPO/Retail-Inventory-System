import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_PeriodPopup from "../../components/Store Owner/StoreOwner_PeriodPopup";
import StoreOwner_ExportReportPopup from "../../components/Store Owner/StoreOwner_ExportReportPopup";
import "../../Style/Store Owner/Reports.css";
import exportToExcel from "../../utils/exportToExcel";

const formatDateRangeLabel = (from, to) => {
  const formatDate = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  };
  return `${formatDate(from)} - ${formatDate(to)}`;
};

// Mock data for Procurement (until Phase 2)
const PROCUREMENT_DEMAND = [
  { product: "Ace Maize Meal 2.5kg", combined: 100, requested: 50 },
  { product: "Coca-Cola 500ml", combined: 72, requested: 48 },
];

const PROCUREMENT_QUOTES = [
  { supplier: "Tiger Brands Ltd", unitPrice: "R [price]", delivery: "20 Nov" },
  { supplier: "Pioneer Foods", unitPrice: "R [price]", delivery: "22 Nov" },
];

const Reports = () => {
  // UI State
  const [activeTab, setActiveTab] = useState("Sales");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [period, setPeriod] = useState({ value: "7", label: "Last 7 days" });

  // Data State
  const [loading, setLoading] = useState(true);
  const [salesReport, setSalesReport] = useState({
    summary: { totalSales: 0, totalTransactions: 0, averageSale: 0 },
    chartData: [],
    topProducts: [],
    payments: []
  });
  const [inventoryReport, setInventoryReport] = useState({
    summary: { totalProducts: 0, inventoryValue: 0, lowStock: 0, outOfStock: 0 },
    lowStockItems: []
  });

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");

  // --- 1. FETCH REAL DATA FROM BACKEND ---
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const headers = { "Authorization": `Bearer ${token}` };
        
        // Fetch Sales Report
        const salesRes = await fetch(`http://localhost:5000/api/reports/sales?storeId=${storeId}`, { headers });
        if (!salesRes.ok) {
          const errData = await salesRes.json().catch(() => ({}));
          throw new Error(`Sales API Error ${salesRes.status}: ${errData.message || salesRes.statusText}`);
        }
        const salesData = await salesRes.json();
        setSalesReport(salesData);

        // Fetch Inventory Report
        const invRes = await fetch(`http://localhost:5000/api/reports/inventory?storeId=${storeId}`, { headers });
        if (!invRes.ok) {
          const errData = await invRes.json().catch(() => ({}));
          throw new Error(`Inventory API Error ${invRes.status}: ${errData.message || invRes.statusText}`);
        }
        const invData = await invRes.json();
        setInventoryReport(invData);

      } catch (err) {
        console.error("Failed to load reports:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && storeId) fetchReports();
  }, [storeId, token]);

  // --- 2. MEMOIZED CALCULATIONS (Improves Rendering Performance) ---
  const totalPayments = useMemo(() => {
    return salesReport.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [salesReport.payments]);
  
  const bestDay = useMemo(() => {
    return salesReport.chartData.length > 0 
      ? salesReport.chartData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
      : { day: "N/A", amount: 0 };
  }, [salesReport.chartData]);

  // --- 3. EXPORT LOGIC ---
  const handleReportExport = async ({ fileType, includeGraphs }) => {
    if (fileType === "pdf") {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const left = 14;
      let y = 20;

      pdf.setFontSize(18);
      pdf.text(`${activeTab} report`, left, y);
      y += 9;
      pdf.setFontSize(10);
      pdf.setTextColor(95, 99, 104);
      pdf.text(`Period: ${period.label}`, left, y);
      y += 10;

      pdf.setTextColor(17, 17, 17);
      pdf.setFontSize(12);
      pdf.text("Summary", left, y);
      y += 7;
      pdf.setFontSize(10);
      
      let summaryRows = [];
      if (activeTab === "Inventory") {
        summaryRows = [
          ["Inventory value", `R${Number(inventoryReport.summary.inventoryValue).toLocaleString()}`],
          ["Products", String(inventoryReport.summary.totalProducts)],
          ["Low stock", String(inventoryReport.summary.lowStock)],
          ["Out of stock", String(inventoryReport.summary.outOfStock)],
        ];
      } else if (activeTab === "Procurement") {
        summaryRows = [
          ["Open requests", "2"],
          ["Quotes received", "2"],
        ];
      } else {
        summaryRows = [
          ["Sales", `R${Number(salesReport.summary.totalSales).toLocaleString()}`],
          ["Transactions", String(salesReport.summary.totalTransactions)],
          ["Average sale", `R${Number(salesReport.summary.averageSale).toFixed(2)}`],
          ["Best day", `${bestDay.day} - R${bestDay.amount}`],
        ];
      }

      summaryRows.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, left, y);
        y += 6;
      });

      pdf.save(`${activeTab.toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      return;
    }

    // Excel Export
    await exportToExcel({
      fileBaseName: `${activeTab.toLowerCase()}-report`,
      sheetName: `${activeTab} report`,
      columns: [
        { header: "Section", key: "section", width: 20 },
        { header: "Item", key: "item", width: 28 },
        { header: "Value", key: "value", width: 18 },
        { header: "Details", key: "details", width: 36 },
      ],
      rows: activeTab === "Inventory"
        ? [
            { section: "Summary", item: "Inventory value", value: `R${Number(inventoryReport.summary.inventoryValue).toLocaleString()}`, details: "At cost price" },
            { section: "Summary", item: "Products", value: inventoryReport.summary.totalProducts, details: "In this store" },
            { section: "Summary", item: "Low stock", value: inventoryReport.summary.lowStock, details: "Below reorder level" },
            ...inventoryReport.lowStockItems.map((product) => ({
              section: "Lowest stock",
              item: product.name,
              value: product.quantity,
              details: "Needs reorder",
            })),
          ]
        : activeTab === "Procurement"
          ? [
              { section: "Summary", item: "Open requests", value: 2, details: "Waiting for orders" },
            ]
        : [
            { section: "Summary", item: "Sales", value: `R${Number(salesReport.summary.totalSales).toLocaleString()}`, details: period.label },
            { section: "Summary", item: "Transactions", value: salesReport.summary.totalTransactions, details: "" },
            { section: "Summary", item: "Average sale", value: `R${Number(salesReport.summary.averageSale).toFixed(2)}`, details: "Sales divided by transactions" },
            ...salesReport.chartData.map((entry) => ({
              section: "Sales per day",
              item: entry.day,
              value: entry.amount,
              details: "",
            })),
            ...salesReport.topProducts.map((product) => ({
              section: "Top products",
              item: product.name,
              value: product.units,
              details: "Units sold",
            })),
          ],
    });
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading reports...</div>;

  return (
    <div className="app-layout">
      <StoreOwnerSidebar />

      <main className="main-content">
        
        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Reports</h1>
          </div>
          
          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Tabs and Filter Row */}
        <div className="reports-toolbar">
          <div className="reports-tabs">
            {["Sales", "Inventory", "Procurement"].map((tab) => (
              <button
                key={tab}
                className={`report-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="reports-actions">
            <div className="period-dropdown">
              <button
                type="button"
                className="filter-select date-select period-trigger"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setIsPeriodOpen((open) => !open)}
                aria-haspopup="dialog"
                aria-expanded={isPeriodOpen}
              >
                {period.label}
              </button>
              {isPeriodOpen && (
                <StoreOwner_PeriodPopup
                  value={period.value}
                  onClose={() => setIsPeriodOpen(false)}
                  customRange={period.customRange}
                  defaultRange={{ from: "2026-11-07", to: "2026-11-13" }}
                  onApply={({ value, from, to }) => {
                    const labels = {
                      today: "Today",
                      "7": "Last 7 days",
                      "30": "Last 30 days",
                      custom: "Custom range",
                    };
                    setPeriod({
                      value,
                      label: value === "custom" ? formatDateRangeLabel(from, to) : labels[value],
                      customRange: value === "custom" ? { from, to } : null,
                    });
                    setIsPeriodOpen(false);
                  }}
                />
              )}
            </div>
            <div className="export-report-dropdown">
              <button
                type="button"
                className="btn-outline export-btn"
                onClick={() => setIsExportOpen((open) => !open)}
                aria-haspopup="dialog"
                aria-expanded={isExportOpen}
              >
                Export
              </button>
              {isExportOpen && (
                <StoreOwner_ExportReportPopup
                  reportName={activeTab}
                  periodLabel={period.label}
                  onClose={() => setIsExportOpen(false)}
                  onDownload={handleReportExport}
                />
              )}
            </div>
          </div>
        </div>

        {/* --- INVENTORY TAB --- */}
        {activeTab === "Inventory" && (
          <section className="inventory-report">
            <div className="report-stats-grid inventory-report-stats">
              <div className="stat-card">
                <span className="stat-label">Inventory value</span>
                <h3 className="stat-value">R{Number(inventoryReport.summary.inventoryValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <span className="stat-sub">At cost price</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Products</span>
                <h3 className="stat-value">{inventoryReport.summary.totalProducts}</h3>
                <span className="stat-sub">In this store</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Low stock</span>
                <h3 className="stat-value inventory-danger">{inventoryReport.summary.lowStock}</h3>
                <span className="stat-sub">Below reorder level</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Out of stock</span>
                <h3 className="stat-value">{inventoryReport.summary.outOfStock}</h3>
                <span className="stat-sub">Nothing at zero</span>
              </div>
            </div>

            <div className="inventory-report-middle">
              <section className="card inventory-status-card">
                <h2 className="inventory-card-title">Stock status</h2>
                <div
                  className="inventory-status-bar"
                  role="img"
                  aria-label={`${inventoryReport.summary.totalProducts - inventoryReport.summary.lowStock} in stock, ${inventoryReport.summary.lowStock} low, ${inventoryReport.summary.outOfStock} out`}
                >
                  <span className="inventory-status-in-stock" style={{ width: `${((inventoryReport.summary.totalProducts - inventoryReport.summary.lowStock) / inventoryReport.summary.totalProducts) * 100}%` }} />
                  <span className="inventory-status-low" style={{ width: `${(inventoryReport.summary.lowStock / inventoryReport.summary.totalProducts) * 100}%` }} />
                </div>
                <div className="inventory-status-legend">
                  <div className="inventory-status-item">
                    <span><i className="inventory-status-dot in-stock" />In stock</span>
                    <strong>{inventoryReport.summary.totalProducts - inventoryReport.summary.lowStock} products</strong>
                  </div>
                  <div className="inventory-status-item">
                    <span><i className="inventory-status-dot low-stock" />Low</span>
                    <strong>{inventoryReport.summary.lowStock} products</strong>
                  </div>
                  <div className="inventory-status-item">
                    <span><i className="inventory-status-dot out-stock" />Out of stock</span>
                    <strong>{inventoryReport.summary.outOfStock} products</strong>
                  </div>
                </div>
              </section>

              <section className="card inventory-insights-card">
                <h2 className="inventory-card-title">What the numbers say</h2>
                <p>{inventoryReport.summary.lowStock} of {inventoryReport.summary.totalProducts} products are below their reorder level.</p>
                <p>Your stock is worth R{Number(inventoryReport.summary.inventoryValue).toLocaleString()} at cost.</p>
                <Link to="/store-owner/inventory/movement-history">See every stock movement</Link>
              </section>
            </div>

            <section className="card inventory-low-stock-card">
              <h2 className="inventory-card-title">Lowest stock</h2>
              <div className="inventory-low-stock-list">
                {inventoryReport.lowStockItems.length > 0 ? inventoryReport.lowStockItems.map((product) => (
                  <div className="inventory-low-stock-item" key={product.name}>
                    <div className="inventory-low-stock-heading">
                      <span>{product.name}</span>
                      <strong>{product.quantity}</strong>
                    </div>
                    <div className="inventory-low-stock-track" role="img">
                      <span style={{ width: `${(product.quantity / 15) * 100}%` }} />
                    </div>
                  </div>
                )) : <p>All products are healthy!</p>}
              </div>
            </section>
          </section>
        )}

        {/* --- PROCUREMENT TAB --- */}
        {activeTab === "Procurement" && (
          <section className="procurement-report">
            <div className="report-stats-grid procurement-report-stats">
              <div className="stat-card">
                <span className="stat-label">Open requests</span>
                <h3 className="stat-value">2</h3>
                <span className="stat-sub">Waiting for orders</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Quotes received</span>
                <h3 className="stat-value">2</h3>
                <span className="stat-sub">On maize meal</span>
              </div>
            </div>
            <div className="procurement-report-main">
              <section className="card procurement-demand-card">
                <h2 className="procurement-card-title">Combined demand by product</h2>
                <p style={{ color: '#666' }}>Procurement module coming soon.</p>
              </section>
            </div>
          </section>
        )}

        {/* --- SALES TAB --- */}
        {activeTab === "Sales" && (
          <>
            <div className="report-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Sales</span>
                <h3 className="stat-value">R{Number(salesReport.summary.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <span className="stat-sub">Live data</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Transactions</span>
                <h3 className="stat-value">{salesReport.summary.totalTransactions}</h3>
              </div>
              <div className="stat-card">
                <span className="stat-label">Average sale</span>
                <h3 className="stat-value">R{Number(salesReport.summary.averageSale).toFixed(2)}</h3>
                <span className="stat-sub">Sales divided by transactions</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Best day</span>
                <h3 className="stat-value">{bestDay.day}</h3>
                <span className="stat-sub">R{Number(bestDay.amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="reports-row-2-col">
              <div className="card chart-card">
                <h3 className="card-title">Sales per day</h3>
                <div className="chart-container">
                  {salesReport.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesReport.chartData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis hide />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={60}>
                          {salesReport.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === salesReport.chartData.length - 1 ? "#000" : "#d1d5db"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No sales data yet.</div>
                  )}
                </div>
              </div>

              <div className="card payment-card">
                <h3 className="card-title">Payment methods</h3>
                <div className="payment-legend" style={{ marginTop: '20px' }}>
                  {salesReport.payments.length > 0 ? salesReport.payments.map((p, i) => {
                    const percent = totalPayments > 0 ? (p.amount / totalPayments) * 100 : 0;
                    return (
                      <div className="legend-item" key={i} style={{ marginBottom: '15px' }}>
                        <div className="legend-label"><span className={`legend-dot dot-${p.method.toLowerCase()}`}></span> {p.method}</div>
                        <div className="legend-value">R{Number(p.amount).toLocaleString()} ({percent.toFixed(1)}%)</div>
                      </div>
                    );
                  }) : <p>No payment data.</p>}
                </div>
              </div>
            </div>

            <div className="reports-row-2-col">
              <div className="card top-products-card">
                <h3 className="card-title">Top products, units sold</h3>
                <div className="products-bar-list">
                  {salesReport.topProducts.length > 0 ? salesReport.topProducts.map((product, index) => (
                    <div key={index} className="product-bar-item" style={{ marginBottom: '15px' }}>
                      <div className="product-bar-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="product-name">{product.name}</span>
                        <span className="product-units">{product.units}</span>
                      </div>
                      <div className="product-bar-bg" style={{ backgroundColor: '#eee', height: '8px', borderRadius: '4px', marginTop: '5px' }}>
                        <div className="product-bar-fill" style={{ width: `${(product.units / salesReport.topProducts[0].units) * 100}%`, backgroundColor: '#000', height: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  )) : <p>No products sold yet.</p>}
                </div>
              </div>

              <div className="card insights-card">
                <h3 className="card-title">What the numbers say</h3>
                <div className="insights-list">
                  <p className="insight-text">
                    {salesReport.topProducts.length > 0 ? `${salesReport.topProducts[0].name} is your best seller: ${salesReport.topProducts[0].units} sold.` : "Start selling to see insights."}
                  </p>
                  <p className="insight-text">
                    Your average sale is R{Number(salesReport.summary.averageSale).toFixed(2)}.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;