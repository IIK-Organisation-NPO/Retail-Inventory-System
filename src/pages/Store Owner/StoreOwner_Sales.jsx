// src/pages/Store Owner/StoreOwner_Sales.jsx
import { useMemo, useState, useEffect } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Sales.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_RecordSale_popup from "../../components/Store Owner/StoreOwner_RecordSale_popup";
import exportToExcel from "../../utils/exportToExcel";
import formatRand from "../../utils/formatRand";

const PAGE_SIZE = 5;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "2026-11-13" -> "13 Nov 2026"
const formatDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

const StoreOwner_Sales = () => {
  // --- Real Data State ---
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filters & UI State ---
  const [date, setDate] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showRecordSale, setShowRecordSale] = useState(false);

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");

  // --- 1. FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // Fetch products for the dropdown and the popup
      const prodRes = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, { headers });
      const prodData = await prodRes.json();
      if (prodRes.ok) {
        setProducts(prodData.map(p => ({
          id: p.ProductID,
          product: p.Name,
          price: Number(p.SellingPrice),
          onHand: p.OnHand,
          barcode: p.Barcode
        })));
      }

      // Fetch sales history
      const salesRes = await fetch(`http://localhost:5000/api/sales/history?storeId=${storeId}`, { headers });
      const salesData = await salesRes.json();
      if (salesRes.ok) {
        // Map backend response to what the table expects
        const formattedSales = salesData.map(s => ({
          id: s.id,
          date: s.date, 
          time: s.time, 
          cashier: s.cashier || "Store Owner", 
          itemsText: s.itemsText, // The backend sends the combined string
          payment: s.payment,
          total: Number(s.total)
        }));
        setTransactions(formattedSales);
        
        // Set default date to the most recent sale date, or today if none
        if (formattedSales.length > 0 && !date) {
          setDate(formattedSales[0].date);
        } else if (formattedSales.length === 0) {
          setDate(todayISO());
        }
      }
    } catch (err) {
      console.error("Failed to load sales data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [storeId, token]);

  // --- 2. FILTER OPTIONS ---
  const dateOptions = useMemo(() => {
    const dates = [...new Set(transactions.map((t) => t.date))].sort().reverse();
    // Ensure today is always an option even if no sales yet
    if (!dates.includes(todayISO())) dates.unshift(todayISO());
    return dates;
  }, [transactions]);

  const cashiers = useMemo(() => {
    return [...new Set(transactions.map((t) => t.cashier))].sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  // --- 3. APPLY FILTERS ---
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.date === date)
      // Filter by searching the itemsText string for the selected product name
      .filter((t) => {
        if (productFilter === "all") return true;
        const p = products.find(prod => String(prod.id) === productFilter);
        return p ? t.itemsText.includes(p.product) : true;
      })
      .filter((t) => userFilter === "all" || t.cashier === userFilter)
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [transactions, date, productFilter, userFilter, products]);

  // --- 4. SUMMARY CALCULATIONS ---
  const salesTotal = filtered.reduce((sum, t) => sum + t.total, 0);
  const averageSale = filtered.length ? salesTotal / filtered.length : 0;
  const salesLabel = date === todayISO() ? "Sales today" : `Sales on ${formatDate(date)}`;

  // --- 5. PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  // --- 6. EXPORT ---
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
          items: t.itemsText,
          payment: t.payment,
          total: t.total,
        })),
      });
    } catch (err) {
      console.error("Export failed:", err);
      alert("Sorry, the export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- 7. COMPLETE SALE (Send to Backend) ---
  const handleCompleteSale = async (sale) => {
    try {
      // Build payload for the backend
      const payload = {
        storeId: storeId,
        paymentMethod: sale.payment,
        items: sale.items.map(item => ({
          productId: item.productId,
          price: item.price,
          quantity: item.qty
        }))
      };

      const response = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to record sale");

      // Success! Close popup and refresh the page data
      setShowRecordSale(false);
      setDate(todayISO());
      setProductFilter("all");
      setUserFilter("all");
      setPage(1);
      fetchData(); // Reload from DB to show the new sale and updated totals

    } catch (err) {
      alert("Error recording sale: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading sales data...</div>;

  return (
    <div className="so-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="so-main">
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
                    <td colSpan={5} className="sl-empty" style={{ textAlign: "center", padding: "20px" }}>
                      No transactions match these filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((t) => (
                    <tr key={t.id}>
                      <td>{t.time}</td>
                      <td>{t.cashier}</td>
                      <td className="sl-items">{t.itemsText}</td>
                      <td>{t.payment}</td>
                      <td>{formatRand(t.total)}</td>
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

      {/* RECORD SALE POPUP */}
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