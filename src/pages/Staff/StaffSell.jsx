// src/pages/Staff/StaffSell.jsx
import { useMemo, useState, useEffect } from "react";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_ScanBarcode_popup from "../../components/Store Owner/StoreOwner_ScanBarcode_popup";
import StaffSaleRecordedPopup from "../../components/Staff/StaffSaleRecordedPopup";
import formatRand from "../../utils/formatRand";
import "../../Style/Staff/StaffSell.css";

const StaffSell = () => {
  // Data State
  const [products, setProducts] = useState([]);
  const [storeName, setStoreName] = useState("My Store");
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");

  // Sale State
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [received, setReceived] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [initialScanned, setInitialScanned] = useState([]);
  const [completedSale, setCompletedSale] = useState(null);

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Staff Member";

  // --- 1. FETCH REAL PRODUCTS FROM DB ---
  const fetchProducts = async () => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      const prodRes = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, { headers });
      const data = await prodRes.json();
      
      if (prodRes.ok) {
        setProducts(data.map(p => ({
          id: p.ProductID,
          product: p.Name,
          price: Number(p.SellingPrice),
          onHand: p.OnHand,
          barcode: p.Barcode
        })));
      }

      // Fetch store name
      const storeRes = await fetch(`http://localhost:5000/api/stores/my-stores`, { headers });
      const storeData = await storeRes.json();
      if (storeRes.ok && storeData.length > 0) {
        const currentStore = storeData.find(s => s.StoreID === Number(storeId));
        if (currentStore) setStoreName(currentStore.StoreName);
      }

    } catch (err) {
      setGlobalError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [storeId, token]);

  // --- UI HELPERS ---
  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    return products.filter(
      (product) =>
        product.product.toLowerCase().includes(search) ||
        (product.barcode && product.barcode.includes(search))
    );
  }, [products, query]);

  const total = Math.round(
    cart.reduce((sum, item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return sum + (product?.price ?? 0) * item.qty;
    }, 0) * 100
  ) / 100;

  const change = received !== "" && Number(received) >= total
    ? Math.round((Number(received) - total) * 100) / 100
    : null;

  const quantityInCart = (productId) =>
    cart.find((item) => item.productId === productId)?.qty ?? 0;

  const changeQuantity = (productId, changeBy) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentQty = quantityInCart(productId);
    if (currentQty + changeBy > product.onHand) {
      setError(`Only ${product.onHand} of ${product.product} in stock.`);
      return;
    }

    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, qty: item.qty + changeBy }
            : item
        )
        .filter((item) => item.qty > 0)
    );
    setError("");
  };

  const addProductToSale = (product) => {
    if (quantityInCart(product.id) >= product.onHand) {
      setError(`No more ${product.product} in stock.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      return existing
        ? current.map((item) =>
            item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
          )
        : [...current, { productId: product.id, qty: 1 }];
    });
    setError("");
    setNotice(`${product.product} added to current sale.`);
  };

  // --- 2. COMPLETE SALE TO DB ---
  const handleCompleteSale = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      setError("Add at least one product to the sale.");
      return;
    }
    if (payment === "Cash" && (!Number.isFinite(Number(received)) || Number(received) < total)) {
      setError(`Amount received must be at least ${formatRand(total)}.`);
      return;
    }

    setError("");

    try {
      const payload = {
        storeId: storeId,
        paymentMethod: payment,
        items: cart.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            price: product.price,
            quantity: item.qty
          };
        })
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

      // Calculate updated stock for the success popup
      const updatedStockList = cart.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          product: product.product,
          onHand: product.onHand - item.qty
        };
      });

      // Success! Show the success popup with receipt details
      setCompletedSale({
        total,
        payment,
        received: payment === "Cash" ? Number(received) : total,
        change: payment === "Cash" ? change : 0,
        stockUpdated: updatedStockList, // <-- Added so popup displays correctly
        recordedAt: new Date()
      });

      // Reset cart
      setCart([]);
      setReceived("");
      
      // Refresh products to show updated stock
      fetchProducts();

    } catch (err) {
      setError(err.message);
    }
  };

  const clearSale = () => {
    setCart([]);
    setReceived("");
    setError("");
    setNotice("");
  };

  const addScannedProducts = (scanned) => {
    setCart((current) =>
      scanned.reduce((items, { productId, qty }) => {
        const existing = items.find((item) => item.productId === productId);
        return existing
          ? items.map((item) =>
              item.productId === productId ? { ...item, qty: item.qty + qty } : item
            )
          : [...items, { productId, qty }];
      }, current)
    );
    setError("");
    setNotice("");
    setShowScanner(false);
    setInitialScanned([]);
  };

  const openScanner = (items = []) => {
    setInitialScanned(items);
    setShowScanner(true);
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading POS...</div>;

  return (
    <div className="staff-sell-layout">
      <Staff_Sidebar alertCount={3} />

      <main className="staff-sell-main">
        <header className="staff-sell-header">
          <h1>New sale</h1>
          <div className="staff-sell-header-actions">
            <span className="staff-sell-sync">Synced just now</span>
            <StoreOwner_StoreSwitcher readOnly />
            <StoreOwner_UserMenu
              name={userName}
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {globalError && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {globalError}
          </div>
        )}

        <div className="staff-sell-grid">
          <section className="staff-sell-card staff-sell-products">
            <h2>Products</h2>
            <div className="staff-sell-search-row">
              <input
                type="search"
                aria-label="Search products by name or barcode"
                placeholder="Search by name or barcode"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" className="staff-sell-button staff-sell-outline" onClick={() => openScanner()}>
                Scan barcode
              </button>
            </div>

            <div className="staff-sell-table-wrap">
              <table className="staff-sell-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>In stock</th>
                    <th><span className="staff-sell-visually-hidden">Add to sale</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const left = product.onHand - quantityInCart(product.id);
                    return (
                      <tr key={product.id}>
                        <td>{product.product}</td>
                        <td>{formatRand(product.price)}</td>
                        <td>
                          <span>{left}</span>
                          {left < 15 && <span className="staff-sell-low-stock">Low</span>}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="staff-sell-button staff-sell-add"
                            disabled={left <= 0}
                            onClick={() => addProductToSale(product)}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleProducts.length === 0 && (
                    <tr>
                      <td className="staff-sell-no-results" colSpan="4">No matching products.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form className="staff-sell-card staff-sell-current" onSubmit={handleCompleteSale}>
            <h2>Current sale</h2>

            {cart.length ? (
              <ul className="staff-sell-cart">
                {cart.map((item) => {
                  const product = products.find((entry) => entry.id === item.productId);
                  if (!product) return null;
                  return (
                    <li key={item.productId}>
                      <div className="staff-sell-cart-product">
                        <strong>{product.product}</strong>
                        <span>{formatRand(product.price)} each</span>
                      </div>
                      <div className="staff-sell-quantity">
                        <button
                          type="button"
                          aria-label={`Remove one ${product.product}`}
                          onClick={() => changeQuantity(product.id, -1)}
                        >
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          aria-label={`Add one ${product.product}`}
                          disabled={item.qty >= product.onHand}
                          onClick={() => changeQuantity(product.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <strong className="staff-sell-line-total">{formatRand(product.price * item.qty)}</strong>
                      <button
                        type="button"
                        className="staff-sell-remove"
                        onClick={() => changeQuantity(product.id, -item.qty)}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="staff-sell-empty">Add products to start a sale.</p>
            )}

            <div className="staff-sell-total">
              <span>Total</span>
              <strong>{formatRand(total)}</strong>
            </div>

            <div className="staff-sell-payments" aria-label="Payment method">
              {["Cash", "Card"].map((method) => (
                <button
                  type="button"
                  key={method}
                  className={payment === method ? "is-selected" : ""}
                  aria-pressed={payment === method}
                  onClick={() => {
                    setPayment(method);
                    setError("");
                  }}
                >
                  {method}
                </button>
              ))}
            </div>

            {payment === "Cash" && (
              <div className="staff-sell-cash-fields">
                <label>
                  Amount received (R)
                  <input
                    type="number"
                    min={total}
                    step="0.01"
                    inputMode="decimal"
                    value={received}
                    onChange={(event) => {
                      setReceived(event.target.value);
                      setError("");
                    }}
                  />
                </label>
                <label>
                  Change
                  <output>{change === null ? "—" : formatRand(change)}</output>
                </label>
              </div>
            )}

            {error && <p className="staff-sell-error" role="alert">{error}</p>}
            {notice && <p className="staff-sell-success" role="status">{notice}</p>}

            <button type="submit" className="staff-sell-button staff-sell-complete" disabled={!cart.length}>
              Complete sale
            </button>
            <button type="button" className="staff-sell-button staff-sell-clear" onClick={clearSale}>
              Clear sale
            </button>
          </form>
        </div>
      </main>

      {showScanner && (
        <StoreOwner_ScanBarcode_popup
          products={products}
          initialScanned={initialScanned}
          qtyInSale={quantityInCart}
          onDone={addScannedProducts}
          onCancel={() => {
            setShowScanner(false);
            setInitialScanned([]);
          }}
        />
      )}
      {completedSale && (
        <StaffSaleRecordedPopup
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            setReceived("");
            setError("");
            setNotice("");
          }}
        />
      )}
    </div>
  );
};

export default StaffSell;