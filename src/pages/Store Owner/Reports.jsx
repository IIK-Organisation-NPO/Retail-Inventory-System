import { useState } from "react";
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

const INVENTORY_LOW_STOCK = [
  { name: "Clover Fresh Milk 1L", quantity: 9 },
  { name: "Albany Superior White Bread", quantity: 11 },
  { name: "Fanta Orange 500ml", quantity: 12 },
  { name: "Sasko Premium Bread", quantity: 12 },
  { name: "Ace Maize Meal 2.5kg", quantity: 13 },
];

const INVENTORY_TOTAL_PRODUCTS = 52;
const INVENTORY_LOW_COUNT = INVENTORY_LOW_STOCK.length;
const INVENTORY_IN_STOCK = INVENTORY_TOTAL_PRODUCTS - INVENTORY_LOW_COUNT;
const INVENTORY_REORDER_LEVEL = 15;

const PROCUREMENT_DEMAND = [
  { product: "Ace Maize Meal 2.5kg", combined: 100, requested: 50 },
  { product: "Coca-Cola 500ml", combined: 72, requested: 48 },
];

const PROCUREMENT_QUOTES = [
  { supplier: "Tiger Brands Ltd", unitPrice: "R [price]", delivery: "20 Nov" },
  { supplier: "Pioneer Foods", unitPrice: "R [price]", delivery: "22 Nov" },
];

const Reports = () => {
  // State for the main tabs (Sales, Inventory, Procurement)
  const [activeTab, setActiveTab] = useState("Sales");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [period, setPeriod] = useState({ value: "7", label: "Last 7 days" });

  // Chart data
  const salesData = [
    { day: "Sat", amount: 1420 },
    { day: "Sun", amount: 1690 },
    { day: "Mon", amount: 1250 },
    { day: "Tue", amount: 1980 },
    { day: "Wed", amount: 2210 },
    { day: "Thu", amount: 2640 },
    { day: "Fri", amount: 1842.50 },
  ];

  // Top products data
  const topProducts = [
    { name: "Coca-Cola 500ml", units: 168, percentage: 100 },
    { name: "Simba Chips Original", units: 121, percentage: 72 },
    { name: "NikNaks Cheese", units: 96, percentage: 57 },
    { name: "Sprite 500ml", units: 74, percentage: 44 },
    { name: "Fanta Orange 500ml", units: 59, percentage: 35 },
  ];

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
      const summaryRows = activeTab === "Inventory"
        ? [
            ["Inventory value", "R48,549"],
            ["Products", String(INVENTORY_TOTAL_PRODUCTS)],
            ["Low stock", String(INVENTORY_LOW_COUNT)],
            ["Out of stock", "0"],
          ]
        : activeTab === "Procurement"
          ? [
              ["Open requests", "2"],
              ["Quotes received", "2"],
              ["Maize meal, combined", "100"],
              ["Your share", "50% (50 of 100)"],
            ]
        : [
            ["Sales", "R13,032.50"],
            ["Transactions", "253"],
            ["Average sale", "R51.51"],
            ["Best day", "Thursday - R2,640"],
          ];
      summaryRows.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, left, y);
        y += 6;
      });

      if (includeGraphs) {
        y += 4;
        pdf.setFontSize(12);
        pdf.text(
          activeTab === "Inventory"
            ? "Stock status"
            : activeTab === "Procurement"
              ? "Combined demand by product"
              : "Sales per day",
          left,
          y
        );
        y += 7;
        if (activeTab === "Inventory") {
          const chartWidth = pageWidth - left * 2;
          const inStockWidth = (INVENTORY_IN_STOCK / INVENTORY_TOTAL_PRODUCTS) * chartWidth;
          const lowStockWidth = (INVENTORY_LOW_COUNT / INVENTORY_TOTAL_PRODUCTS) * chartWidth;
          pdf.setFillColor(17, 17, 17);
          pdf.rect(left, y, inStockWidth, 6, "F");
          pdf.setFillColor(200, 16, 46);
          pdf.rect(left + inStockWidth, y, lowStockWidth, 6, "F");
          y += 12;
          pdf.setFontSize(9);
          pdf.text(`In stock: ${INVENTORY_IN_STOCK} products`, left, y);
          pdf.text(`Low: ${INVENTORY_LOW_COUNT} products`, left + 75, y);
          y += 8;
        } else if (activeTab === "Procurement") {
          const chartWidth = pageWidth - left * 2;
          PROCUREMENT_DEMAND.forEach(({ product, combined, requested }) => {
            pdf.setFontSize(9);
            pdf.text(`${product} - ${combined} combined`, left, y);
            y += 5;
            const requestedWidth = (requested / 100) * chartWidth;
            const otherWidth = ((combined - requested) / 100) * chartWidth;
            pdf.setFillColor(17, 17, 17);
            pdf.rect(left, y, requestedWidth, 5, "F");
            pdf.setFillColor(189, 189, 189);
            pdf.rect(left + requestedWidth, y, otherWidth, 5, "F");
            y += 10;
          });
        } else {
          const chartWidth = pageWidth - left * 2 - 42;
          const maximum = Math.max(...salesData.map((item) => item.amount));
          salesData.forEach(({ day, amount }) => {
            pdf.setFontSize(9);
            pdf.text(day, left, y + 4);
            pdf.setFillColor(209, 213, 219);
            pdf.rect(left + 20, y, (amount / maximum) * chartWidth, 5, "F");
            pdf.setTextColor(17, 17, 17);
            pdf.text(`R${amount.toLocaleString()}`, pageWidth - left, y + 4, { align: "right" });
            y += 8;
          });
          y += 4;
        }
      }

      pdf.setFontSize(12);
      pdf.text(
        activeTab === "Inventory"
          ? "Lowest stock"
          : activeTab === "Procurement"
            ? "Supplier quotes"
            : "Top products",
        left,
        y
      );
      y += 7;
      pdf.setFontSize(10);
      if (activeTab === "Inventory") {
        INVENTORY_LOW_STOCK.forEach((product) => {
          pdf.text(product.name, left, y);
          pdf.text(String(product.quantity), pageWidth - left, y, { align: "right" });
          y += 6;
        });
      } else if (activeTab === "Procurement") {
        PROCUREMENT_QUOTES.forEach((quote) => {
          pdf.text(quote.supplier, left, y);
          pdf.text(`${quote.unitPrice} - ${quote.delivery}`, pageWidth - left, y, { align: "right" });
          y += 6;
        });
      } else {
        topProducts.forEach((product) => {
          pdf.text(product.name, left, y);
          pdf.text(`${product.units} units`, pageWidth - left, y, { align: "right" });
          y += 6;
        });
      }

      pdf.save(`${activeTab.toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      return;
    }

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
            { section: "Summary", item: "Inventory value", value: "R48,549", details: "At cost price" },
            { section: "Summary", item: "Products", value: INVENTORY_TOTAL_PRODUCTS, details: "In this store" },
            { section: "Summary", item: "Low stock", value: INVENTORY_LOW_COUNT, details: "Below reorder level" },
            { section: "Summary", item: "Out of stock", value: 0, details: "Nothing at zero" },
            { section: "Stock status", item: "In stock", value: INVENTORY_IN_STOCK, details: "Products" },
            { section: "Stock status", item: "Low", value: INVENTORY_LOW_COUNT, details: "Products" },
            ...INVENTORY_LOW_STOCK.map((product) => ({
              section: "Lowest stock",
              item: product.name,
              value: product.quantity,
              details: `Reorder level ${INVENTORY_REORDER_LEVEL}`,
            })),
          ]
        : activeTab === "Procurement"
          ? [
              { section: "Summary", item: "Open requests", value: 2, details: "Waiting for orders" },
              { section: "Summary", item: "Quotes received", value: 2, details: "On maize meal" },
              { section: "Summary", item: "Maize meal, combined", value: 100, details: "50 + 30 + 20 from 3 stores" },
              { section: "Summary", item: "Your share", value: "50%", details: "50 of 100" },
              ...PROCUREMENT_DEMAND.map((demand) => ({
                section: "Combined demand",
                item: demand.product,
                value: demand.combined,
                details: `Your request: ${demand.requested}; other stores: ${demand.combined - demand.requested}`,
              })),
              ...PROCUREMENT_QUOTES.map((quote) => ({
                section: "Supplier quotes",
                item: quote.supplier,
                value: quote.unitPrice,
                details: `Delivery ${quote.delivery}`,
              })),
            ]
        : [
            { section: "Summary", item: "Sales", value: "R13,032.50", details: period.label },
            { section: "Summary", item: "Transactions", value: 253, details: "About 36 a day" },
            { section: "Summary", item: "Average sale", value: "R51.51", details: "Sales divided by transactions" },
            { section: "Summary", item: "Best day", value: "Thursday", details: "R2,640" },
            ...salesData.map((entry) => ({
              section: "Sales per day",
              item: entry.day,
              value: entry.amount,
              details: "",
            })),
            ...topProducts.map((product) => ({
              section: "Top products",
              item: product.name,
              value: product.units,
              details: `${product.percentage}% of top seller`,
            })),
          ],
    });
  };

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

        {activeTab === "Inventory" ? (
          <section className="inventory-report">
            <div className="report-stats-grid inventory-report-stats">
              <div className="stat-card">
                <span className="stat-label">Inventory value</span>
                <h3 className="stat-value">R48,549</h3>
                <span className="stat-sub">At cost price</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Products</span>
                <h3 className="stat-value">{INVENTORY_TOTAL_PRODUCTS}</h3>
                <span className="stat-sub">In this store</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Low stock</span>
                <h3 className="stat-value inventory-danger">{INVENTORY_LOW_COUNT}</h3>
                <span className="stat-sub">Below reorder level</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Out of stock</span>
                <h3 className="stat-value">0</h3>
                <span className="stat-sub">Nothing at zero</span>
              </div>
            </div>

            <div className="inventory-report-middle">
              <section className="card inventory-status-card">
                <h2 className="inventory-card-title">Stock status</h2>
                <div
                  className="inventory-status-bar"
                  role="img"
                  aria-label={`${INVENTORY_IN_STOCK} in stock, ${INVENTORY_LOW_COUNT} low, 0 out of stock`}
                >
                  <span className="inventory-status-in-stock" style={{ width: `${(INVENTORY_IN_STOCK / INVENTORY_TOTAL_PRODUCTS) * 100}%` }} />
                  <span className="inventory-status-low" style={{ width: `${(INVENTORY_LOW_COUNT / INVENTORY_TOTAL_PRODUCTS) * 100}%` }} />
                </div>
                <div className="inventory-status-legend">
                  <div className="inventory-status-item">
                    <span><i className="inventory-status-dot in-stock" />In stock</span>
                    <strong>{INVENTORY_IN_STOCK} products</strong>
                  </div>
                  <div className="inventory-status-item">
                    <span><i className="inventory-status-dot low-stock" />Low</span>
                    <strong>{INVENTORY_LOW_COUNT} products</strong>
                  </div>
                  <div className="inventory-status-item">
                    <span><i className="inventory-status-dot out-stock" />Out of stock</span>
                    <strong>0 products</strong>
                  </div>
                </div>
              </section>

              <section className="card inventory-insights-card">
                <h2 className="inventory-card-title">What the numbers say</h2>
                <p>{INVENTORY_LOW_COUNT} of {INVENTORY_TOTAL_PRODUCTS} products are below their reorder level.</p>
                <p>Your stock is worth R48,549 at cost.</p>
                <Link to="/store-owner/inventory/movement-history">See every stock movement</Link>
              </section>
            </div>

            <section className="card inventory-low-stock-card">
              <h2 className="inventory-card-title">Lowest stock (reorder level is {INVENTORY_REORDER_LEVEL})</h2>
              <div className="inventory-low-stock-list">
                {INVENTORY_LOW_STOCK.map((product) => (
                  <div className="inventory-low-stock-item" key={product.name}>
                    <div className="inventory-low-stock-heading">
                      <span>{product.name}</span>
                      <strong>{product.quantity}</strong>
                    </div>
                    <div
                      className="inventory-low-stock-track"
                      role="img"
                      aria-label={`${product.quantity} in stock, reorder level ${INVENTORY_REORDER_LEVEL}`}
                    >
                      <span style={{ width: `${(product.quantity / INVENTORY_REORDER_LEVEL) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : activeTab === "Procurement" ? (
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
              <div className="stat-card">
                <span className="stat-label">Maize meal, combined</span>
                <h3 className="stat-value">100</h3>
                <span className="stat-sub">50 + 30 + 20 from 3 stores</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Your share</span>
                <h3 className="stat-value">50%</h3>
                <span className="stat-sub">50 of 100</span>
              </div>
            </div>

            <div className="procurement-report-main">
              <section className="card procurement-demand-card">
                <h2 className="procurement-card-title">Combined demand by product</h2>
                <div className="procurement-demand-list">
                  {PROCUREMENT_DEMAND.map((demand) => (
                    <div className="procurement-demand-item" key={demand.product}>
                      <div className="procurement-demand-heading">
                        <span>{demand.product}</span>
                        <strong>{demand.combined} combined</strong>
                      </div>
                      <div
                        className="procurement-demand-bar"
                        role="img"
                        aria-label={`${demand.combined} combined: your request ${demand.requested}, other stores ${demand.combined - demand.requested}`}
                      >
                        <span className="procurement-demand-own" style={{ width: `${demand.requested}%` }} />
                        <span className="procurement-demand-others" style={{ width: `${demand.combined - demand.requested}%` }} />
                      </div>
                      <p>Your request: {demand.requested}</p>
                    </div>
                  ))}
                </div>
                <div className="procurement-demand-legend">
                  <span><i className="procurement-demand-dot own" />Your request</span>
                  <span><i className="procurement-demand-dot others" />Other stores</span>
                </div>
              </section>

              <section className="card procurement-quotes-card">
                <h2 className="procurement-card-title">Supplier quotes</h2>
                <div className="procurement-quotes-table-wrap">
                  <table className="procurement-quotes-table">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Unit price</th>
                        <th>Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PROCUREMENT_QUOTES.map((quote) => (
                        <tr key={quote.supplier}>
                          <td>{quote.supplier}</td>
                          <td>{quote.unitPrice}</td>
                          <td>{quote.delivery}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="procurement-report-secondary">
              <section className="card procurement-note-card">
                <h2 className="procurement-card-title">Supplier performance</h2>
                <p>This report fills in after your first delivery.</p>
              </section>
              <section className="card procurement-note-card">
                <h2 className="procurement-card-title">Purchase trends</h2>
                <p>Trends appear after a few orders.</p>
              </section>
            </div>
          </section>
        ) : (
          <>
        {/* Summary Stat Cards */}
        <div className="report-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Sales, last 7 days</span>
            <h3 className="stat-value">R13,032.50</h3>
            <span className="stat-sub">Up 12.0% on the week before</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Transactions</span>
            <h3 className="stat-value">253</h3>
            <span className="stat-sub">About 36 a day</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average sale</span>
            <h3 className="stat-value">R51.51</h3>
            <span className="stat-sub">Sales divided by transactions</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best day</span>
            <h3 className="stat-value">Thursday</h3>
            <span className="stat-sub">R2,640</span>
          </div>
        </div>

        {/* Middle Row: Chart & Payment Methods */}
        <div className="reports-row-2-col">
          
          {/* Sales Chart */}
          <div className="card chart-card">
            <h3 className="card-title">Sales per day</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={60}>
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? "#000" : "#d1d5db"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Custom Labels for bars to match screenshot */}
              <div className="chart-labels-overlay">
                {salesData.map((entry, index) => (
                  <div key={index} className="chart-label">
                    {index === 6 ? `R${entry.amount.toLocaleString()}` : `R${entry.amount.toLocaleString()}`}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card payment-card">
            <h3 className="card-title">Payment methods</h3>
            
            {/* Progress bar */}
            <div className="payment-progress-bar">
              <div className="progress-cash" style={{ width: "70%" }}></div>
              <div className="progress-card" style={{ width: "30%" }}></div>
            </div>
            
            {/* Legend */}
            <div className="payment-legend">
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot dot-cash"></span> Cash
                </div>
                <div className="legend-value">R9,122.75 (70.0%)</div>
              </div>
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot dot-card"></span> Card
                </div>
                <div className="legend-value">R3,909.75 (30.0%)</div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Row: Top Products & Insights */}
        <div className="reports-row-2-col">
          
          {/* Top Products */}
          <div className="card top-products-card">
            <h3 className="card-title">Top products, units sold</h3>
            
            <div className="products-bar-list">
              {topProducts.map((product, index) => (
                <div key={index} className="product-bar-item">
                  <div className="product-bar-header">
                    <span className="product-name">{product.name}</span>
                    <span className="product-units">{product.units}</span>
                  </div>
                  <div className="product-bar-bg">
                    <div className="product-bar-fill" style={{ width: `${product.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="card insights-card">
            <h3 className="card-title">What the numbers say</h3>
            
            <div className="insights-list">
              <p className="insight-text">
                Sales are up 12.0% on the week before (R13,032.50 against R11,640.00).
              </p>
              <p className="insight-text">
                Thursday was your best day (R2,640). Monday was the slowest (R1,250).
              </p>
              <p className="insight-text">
                70.0% of sales were paid in cash.
              </p>
              <p className="insight-text">
                Coca-Cola 500ml is your best seller: 168 sold.
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