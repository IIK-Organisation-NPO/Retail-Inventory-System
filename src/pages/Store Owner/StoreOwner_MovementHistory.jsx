// src/pages/Store Owner/StoreOwner_MovementHistory.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_MovementHistory.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_PeriodPopup from "../../components/Store Owner/StoreOwner_PeriodPopup";
import exportToExcel from "../../utils/exportToExcel";

// Mock data — replace with API data once the backend is connected
const MOVEMENTS = [
  { id: 1, date: "2026-11-13T16:42", product: "Coca-Cola 500ml", type: "Sale", change: -2, onHandAfter: 89, by: "Lindiwe Ngcobo", details: "Cash" },
  { id: 2, date: "2026-11-13T16:42", product: "Simba Chips Original", type: "Sale", change: -1, onHandAfter: 38, by: "Lindiwe Ngcobo", details: "Cash" },
  { id: 3, date: "2026-11-13T13:55", product: "Sprite 500ml", type: "Sale", change: -3, onHandAfter: 55, by: "Lindiwe Ngcobo", details: "Cash" },
  { id: 4, date: "2026-11-12T17:40", product: "Sprite 500ml", type: "Adjustment", change: -2, onHandAfter: 58, by: "Sipho Dlamini", details: "Stock count (was 60)" },
  { id: 5, date: "2026-11-12T11:20", product: "NikNaks Cheese", type: "Sale", change: -4, onHandAfter: 66, by: "Bheki Sithole", details: "Mobile money" },
  { id: 6, date: "2026-11-11T09:30", product: "Coca-Cola 500ml", type: "Stock in", change: 24, onHandAfter: 91, by: "Sipho Dlamini", details: "Tiger Brands Ltd" },
  { id: 7, date: "2026-11-10T14:05", product: "Fanta Orange 500ml", type: "Stock out", change: -1, onHandAfter: 12, by: "Sipho Dlamini", details: "Damaged" },
  { id: 8, date: "2026-11-10T09:00", product: "Lay's Salt & Vinegar", type: "Stock in", change: 24, onHandAfter: 24, by: "Sipho Dlamini", details: "Tiger Brands Ltd" },
  { id: 9, date: "2026-11-09T15:10", product: "Fanta Orange 500ml", type: "Sale", change: -3, onHandAfter: 13, by: "Lindiwe Ngcobo", details: "Cash" },
  { id: 10, date: "2026-11-08T10:45", product: "NikNaks Cheese", type: "Stock in", change: 36, onHandAfter: 70, by: "Sipho Dlamini", details: "Tiger Brands Ltd" },
  { id: 11, date: "2026-11-07T16:20", product: "Simba Chips Original", type: "Sale", change: -2, onHandAfter: 39, by: "Bheki Sithole", details: "Cash" },
  { id: 12, date: "2026-11-06T12:00", product: "Coca-Cola 500ml", type: "Sale", change: -5, onHandAfter: 67, by: "Lindiwe Ngcobo", details: "Mobile money" },
  { id: 13, date: "2026-11-05T09:15", product: "Sprite 500ml", type: "Stock in", change: 24, onHandAfter: 60, by: "Sipho Dlamini", details: "Coca-Cola Beverages SA" },
  { id: 14, date: "2026-11-04T18:30", product: "Fanta Orange 500ml", type: "Stock out", change: -2, onHandAfter: 16, by: "Bheki Sithole", details: "Expired" },
  { id: 15, date: "2026-11-03T11:40", product: "Simba Chips Original", type: "Sale", change: -4, onHandAfter: 41, by: "Lindiwe Ngcobo", details: "Cash" },
  { id: 16, date: "2026-11-01T08:30", product: "Coca-Cola 500ml", type: "Adjustment", change: 1, onHandAfter: 72, by: "Sipho Dlamini", details: "Stock count (was 71)" },
  { id: 17, date: "2026-10-28T14:00", product: "Lay's Salt & Vinegar", type: "Sale", change: -6, onHandAfter: 0, by: "Bheki Sithole", details: "Cash" },
  { id: 18, date: "2026-10-20T10:10", product: "Fanta Orange 500ml", type: "Stock in", change: 18, onHandAfter: 18, by: "Sipho Dlamini", details: "Coca-Cola Beverages SA" },
];

const PAGE_SIZE = 8;

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const MOVEMENT_TYPES = ["Sale", "Stock in", "Stock out", "Adjustment"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n) => String(n).padStart(2, "0");

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

// "13 Nov, 16:42"
const formatDateTime = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "13 Nov 2026, 16:42" — includes the year for the exported file
const formatDateTimeWithYear = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "+24" / "−2"
const formatChange = (change) => (change > 0 ? `+${change}` : `−${Math.abs(change)}`);

const typeClassName = (type) => `mh-type mh-type-${type.toLowerCase().replace(/\s+/g, "-")}`;

// Date ranges are measured back from the newest movement, so the mock data
// stays visible. Switch this to `new Date()` once real data is connected.
const REFERENCE_DATE = new Date(
  Math.max(...MOVEMENTS.map((m) => new Date(m.date).getTime()))
);

const unique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
const PRODUCTS = unique(MOVEMENTS.map((m) => m.product));
const PEOPLE = unique(MOVEMENTS.map((m) => m.by));

// Export the given movements to an .xlsx file
const exportMovements = (rows) =>
  exportToExcel({
    fileBaseName: "movement-history",
    sheetName: "Movement history",
    columns: [
      { header: "Date and time", key: "date", width: 20 },
      { header: "Product", key: "product", width: 24 },
      { header: "Type", key: "type", width: 14 },
      { header: "Change", key: "change", width: 10, numFmt: "+0;-0;0" },
      { header: "On hand after", key: "onHandAfter", width: 14 },
      { header: "By", key: "by", width: 20 },
      { header: "Details", key: "details", width: 26 },
    ],
    rows: rows.map((m) => ({ ...m, date: formatDateTimeWithYear(m.date) })),
  });

const StoreOwner_MovementHistory = () => {
  const [dateRange, setDateRange] = useState("7");
  const [customRange, setCustomRange] = useState(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [product, setProduct] = useState("all");
  const [type, setType] = useState("all");
  const [person, setPerson] = useState("all");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Apply the filters and sort newest first
  const filtered = useMemo(() => {
    let cutoff = null;
    let customStart = null;
    let customEnd = null;

    if (dateRange === "today") {
      cutoff = new Date(REFERENCE_DATE);
      cutoff.setHours(0, 0, 0, 0);
    } else if (dateRange === "custom" && customRange) {
      customStart = new Date(`${customRange.from}T00:00:00`);
      customEnd = new Date(`${customRange.to}T23:59:59`);
    } else if (dateRange !== "all") {
      cutoff = new Date(REFERENCE_DATE.getTime() - Number(dateRange) * 24 * 60 * 60 * 1000);
    }

    return MOVEMENTS.filter((m) => {
      const movementDate = new Date(m.date);
      if (cutoff && movementDate < cutoff) return false;
      if (customStart && (movementDate < customStart || movementDate > customEnd)) return false;
      if (product !== "all" && m.product !== product) return false;
      if (type !== "all" && m.type !== type) return false;
      if (person !== "all" && m.by !== person) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [dateRange, customRange, product, type, person]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // Change a filter and jump back to the first page
  const handleFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportMovements(filtered);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Sorry, the export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="so-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <StoreOwnerSidebar notificationCount={3} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="so-main">
        {/* Page header: title, store selector, export, user avatar */}
        <header className="so-header">
          <h1 className="so-page-title">Movement history</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />

            <button
              type="button"
              className="so-btn so-btn-outline"
              onClick={handleExport}
              disabled={isExporting || filtered.length === 0}
            >
              {isExporting ? "Exporting…" : "Export"}
            </button>

            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Back link */}
        <Link to="/store-owner/inventory" className="mh-back-link">
          ← Back to Inventory
        </Link>

        {/* Filters */}
        <div className="mh-filters">
          <div className="period-dropdown">
            <button
              type="button"
              className="mh-select mh-period-trigger"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => setIsPeriodOpen((open) => !open)}
              aria-label="Date range"
              aria-haspopup="dialog"
              aria-expanded={isPeriodOpen}
            >
              {dateRange === "custom" && customRange
                ? formatDateRangeLabel(customRange.from, customRange.to)
                : DATE_RANGES.find((range) => range.value === dateRange)?.label ||
                  (dateRange === "today" ? "Today" : "Custom range")}
            </button>
            {isPeriodOpen && (
              <StoreOwner_PeriodPopup
                value={dateRange}
                includeAllTime
                customRange={customRange}
                defaultRange={{ from: "2026-11-07", to: "2026-11-13" }}
                onClose={() => setIsPeriodOpen(false)}
                onApply={({ value, from, to }) => {
                  setDateRange(value);
                  setCustomRange(value === "custom" ? { from, to } : null);
                  setPage(1);
                  setIsPeriodOpen(false);
                }}
              />
            )}
          </div>

          <select className="mh-select" value={product} onChange={handleFilter(setProduct)} aria-label="Product">
            <option value="all">All products</option>
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select className="mh-select" value={type} onChange={handleFilter(setType)} aria-label="Movement type">
            <option value="all">All types</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select className="mh-select" value={person} onChange={handleFilter(setPerson)} aria-label="Person">
            <option value="all">All people</option>
            {PEOPLE.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Movements table */}
        <section className="so-card mh-card">
          <div className="so-card-header">
            <h2 className="so-card-title">Every stock movement, newest first</h2>
          </div>

          <div className="so-table-wrapper">
            <table className="so-table mh-table">
              <thead>
                <tr>
                  <th>Date and time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>On hand after</th>
                  <th>By</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="mh-empty">
                      No movements match these filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateTime(m.date)}</td>
                      <td>{m.product}</td>
                      <td>
                        <span className={typeClassName(m.type)}>{m.type}</span>
                      </td>
                      <td className="mh-change">{formatChange(m.change)}</td>
                      <td>{m.onHandAfter}</td>
                      <td>{m.by}</td>
                      <td>{m.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mh-pagination">
            <p className="mh-pagination-info">
              {filtered.length === 0
                ? "Showing 0 movements"
                : `Showing ${startIndex + 1} to ${startIndex + pageRows.length} of ${filtered.length} movements`}
            </p>

            <div className="mh-pagination-buttons">
              <button
                type="button"
                className="so-btn so-btn-outline"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="so-btn so-btn-primary"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StoreOwner_MovementHistory;
