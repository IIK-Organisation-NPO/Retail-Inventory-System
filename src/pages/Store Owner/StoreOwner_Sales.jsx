// src/pages/Store Owner/StoreOwner_Sales.jsx
import { useMemo, useState } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Sales.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_RecordSale_popup from "../../components/Store Owner/StoreOwner_RecordSale_popup";
import exportToExcel from "../../utils/exportToExcel";
import formatRand from "../../utils/formatRand";

// Mock data — replace with API data once the backend is connected
const CURRENT_USER = "Sipho Dlamini";

const PRODUCTS = [
  { id: 1, product: "Coca-Cola 500ml", price: 26.5, onHand: 89, barcode: "5449000000996" },
  { id: 2, product: "Simba Chips Original", price: 14.63, onHand: 38, barcode: "6001234500028" },
  { id: 3, product: "Sprite 500ml", price: 21.45, onHand: 55, barcode: "6001234500035" },
  { id: 4, product: "NikNaks Cheese", price: 15.0, onHand: 66, barcode: "6001234500042" },
  { id: 5, product: "Fanta Orange 500ml", price: 20.55, onHand: 12, barcode: "6001234500059" },
  { id: 6, product: "Ace Maize Meal 2.5kg", price: 64.03, onHand: 20, barcode: "6001234500066" },
  { id: 7, product: "Lay's Salt & Vinegar", price: 18.99, onHand: 24, barcode: "6001234500073" },
];

const item = (productId, qty) => {
  const p = PRODUCTS.find((x) => x.id === productId);
  return { productId, name: p.product, price: p.price, qty };
};

const TRANSACTIONS = [
  { id: 1, date: "2026-11-13", time: "16:42", cashier: "Lindiwe Ngcobo", items: [item(1, 2), item(2, 1)], payment: "Cash" },
  { id: 2, date: "2026-11-13", time: "15:10", cashier: "Bheki Sithole", items: [item(6, 1)], payment: "Card" },
  { id: 3, date: "2026-11-13", time: "13:55", cashier: "Lindiwe Ngcobo", items: [item(3, 3)], payment: "Cash" },
  { id: 4, date: "2026-11-13", time: "11:20", cashier: "Bheki Sithole", items: [item(4, 4)], payment: "Mobile money" },
  { id: 5, date: "2026-11-13", time: "09:05", cashier: "Lindiwe Ngcobo", items: [item(5, 2)], payment: "Cash" },
  { id: 6, date: "2026-11-13", time: "08:40", cashier: "Sipho Dlamini", items: [item(7, 2), item(1, 1)], payment: "Cash" },
  { id: 7, date: "2026-11-13", time: "08:15", cashier: "Bheki Sithole", items: [item(2, 3)], payment: "Card" },
  { id: 8, date: "2026-11-13", time: "07:50", cashier: "Lindiwe Ngcobo", items: [item(6, 2)], payment: "Mobile money" },
  { id: 9, date: "2026-11-12", time: "17:30", cashier: "Sipho Dlamini", items: [item(1, 4)], payment: "Cash" },
  { id: 10, date: "2026-11-12", time: "14:20", cashier: "Lindiwe Ngcobo", items: [item(4, 2), item(3, 1)], payment: "Card" },
  { id: 11, date: "2026-11-12", time: "10:05", cashier: "Bheki Sithole", items: [item(5, 1)], payment: "Cash" },
  { id: 12, date: "2026-11-11", time: "12:45", cashier: "Lindiwe Ngcobo", items: [item(6, 1), item(2, 2)], payment: "Mobile money" },
];

const PAGE_SIZE = 5;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "2026-11-13" -> "13 Nov 2026"
const formatDate = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

const transactionTotal = (t) =>
  Math.round(t.items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100) / 100;

// "Coca-Cola 500ml ×2, Simba Chips Original ×1"
const itemsText = (t) => t.items.map((i) => `${i.name} ×${i.qty}`).join(", ");

const StoreOwner_Sales = () => {
  const [products, setProducts] = useState(PRODUCTS);
  const [transactions, setTransactions] = useState(TRANSACTIONS);
  const [date, setDate] = useState(() => TRANSACTIONS.map((t) => t.date).sort().at(-1));
  const [productFilter, setProductFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showRecordSale, setShowRecordSale] = useState(false);

  // Filter options
  const dateOptions = useMemo(
    () => [...new Set(transactions.map((t) => t.date))].sort().reverse(),
    [transactions]
  );
  const cashiers = useMemo(
    () => [...new Set(transactions.map((t) => t.cashier))].sort((a, b) => a.localeCompare(b)),
    [transactions]
  );

  // Apply the filters, newest first
  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => t.date === date)
        .filter((t) => productFilter === "all" || t.items.some((i) => String(i.productId) === productFilter))
        .filter((t) => userFilter === "all" || t.cashier === userFilter)
        .sort((a, b) => b.time.localeCompare(a.time)),
    [transactions, date, productFilter, userFilter]
  );

  // Summary cards
  const salesTotal = filtered.reduce((sum, t) => sum + transactionTotal(t), 0);
  const averageSale = filtered.length ? salesTotal / filtered.length : 0;
  const salesLabel = date === todayISO() ? "Sales today" : `Sales on ${formatDate(date)}`;

  // Pagination
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
      await exportToExcel({
        fileBaseName: "sales",
        sheetName: "Transaction history",
        columns: [
          { header: "Date", key: "date", width: 14 },
          { header: "Time", key: "time", width: 8 },
          { header: "Cashier", key: "cashier", width: 20 },
          { header: "Items", key: "items", width: 48 },
          { header: "Payment", key: "payment", width: 14 },
          { header: "Total", key: "total", width: 12, numFmt: '"R"#,##0.00' },
        ],
        rows: filtered.map((t) => ({
          date: formatDate(t.date),
          time: t.time,
          cashier: t.cashier,
          items: itemsText(t),
          payment: t.payment,
          total: transactionTotal(t),
        })),
      });
    } catch (err) {
      console.error("Export failed:", err);
      alert("Sorry, the export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Add the new sale to the history and take the items out of stock
  const handleCompleteSale = (sale) => {
    const newTransaction = {
      id: Date.now(),
      date: todayISO(),
      time: nowTime(),
      cashier: CURRENT_USER,
      items: sale.items,
      payment: sale.payment,
    };
    setTransactions((current) => [newTransaction, ...current]);
    setProducts((current) =>
      current.map((p) => {
        const sold = sale.items.find((i) => i.productId === p.id);
        return sold ? { ...p, onHand: p.onHand - sold.qty } : p;
      })
    );

    // Show today's sales so the new one is visible
    setDate(todayISO());
    setProductFilter("all");
    setUserFilter("all");
    setPage(1);
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
        {/* Page header: title, store selector, record sale, user menu */}
        <header className="so-header">
          <h1 className="so-page-title">Sales</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />
            <button type="button" className="so-btn so-btn-primary" onClick={() => setShowRecordSale(true)}>
              Record sale
            </button>
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Summary cards */}
        <section className="sl-stats">
          <div className="so-stat-card">
            <p className="so-stat-label">{salesLabel}</p>
            <p className="so-stat-value">{formatRand(salesTotal)}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Transactions</p>
            <p className="so-stat-value">{filtered.length}</p>
          </div>
          <div className="so-stat-card">
            <p className="so-stat-label">Average sale</p>
            <p className="so-stat-value">{formatRand(averageSale)}</p>
          </div>
        </section>

        {/* Filters */}
        <div className="sl-filters">
          <select className="sl-select" value={date} onChange={handleFilter(setDate)} aria-label="Date">
            {dateOptions.map((d) => (
              <option key={d} value={d}>Date: {formatDate(d)}</option>
            ))}
          </select>

          <select className="sl-select" value={productFilter} onChange={handleFilter(setProductFilter)} aria-label="Product">
            <option value="all">All products</option>
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.product}</option>
            ))}
          </select>

          <select className="sl-select" value={userFilter} onChange={handleFilter(setUserFilter)} aria-label="Cashier">
            <option value="all">All users</option>
            {cashiers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Transaction history */}
        <section className="so-card sl-card">
          <div className="so-card-header">
            <h2 className="so-card-title">Transaction history</h2>
            <button
              type="button"
              className="so-link-btn"
              onClick={handleExport}
              disabled={isExporting || filtered.length === 0}
            >
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </div>

          <div className="so-table-wrapper">
            <table className="so-table sl-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Cashier</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="sl-empty">No transactions match these filters.</td>
                  </tr>
                ) : (
                  pageRows.map((t) => (
                    <tr key={t.id}>
                      <td>{t.time}</td>
                      <td>{t.cashier}</td>
                      <td className="sl-items">{itemsText(t)}</td>
                      <td>{t.payment}</td>
                      <td>{formatRand(transactionTotal(t))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="sl-pagination">
            <p className="sl-pagination-info">
              {filtered.length === 0
                ? "Showing 0 transactions"
                : `Showing ${startIndex + 1} to ${startIndex + pageRows.length} of ${filtered.length} transactions`}
            </p>

            <div className="sl-pagination-buttons">
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

      {/* =========================================
          RECORD SALE POPUP
          ========================================= */}
      {showRecordSale && (
        <StoreOwner_RecordSale_popup
          products={products}
          onComplete={handleCompleteSale}
          onClose={() => setShowRecordSale(false)}
        />
      )}
    </div>
  );
};

export default StoreOwner_Sales;
