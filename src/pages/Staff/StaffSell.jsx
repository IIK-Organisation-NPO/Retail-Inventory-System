import { useMemo, useState } from "react";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_ScanBarcode_popup from "../../components/Store Owner/StoreOwner_ScanBarcode_popup";
import StaffSaleRecordedPopup from "../../components/Staff/StaffSaleRecordedPopup";
import { STAFF_STORE } from "../../data/stores";
import formatRand from "../../utils/formatRand";
import "../../Style/Staff/StaffSell.css";

const INITIAL_PRODUCTS = [
  { id: 1, product: "Coca-Cola 500ml", price: 26.5, onHand: 89, barcode: "5449000000996" },
  { id: 2, product: "Simba Chips Original", price: 14.63, onHand: 38, barcode: "6001234500028" },
  { id: 3, product: "NikNaks Cheese", price: 15, onHand: 66, barcode: "6001234500042" },
  { id: 4, product: "Lay's Salt & Vinegar", price: 20.39, onHand: 24, barcode: "6001234500073" },
  { id: 5, product: "Fanta Orange 500ml", price: 20.55, onHand: 12, barcode: "6001234500059" },
  { id: 6, product: "Sprite 500ml", price: 21.45, onHand: 55, barcode: "6001234500035" },
];

const StaffSell = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([
    { productId: 1, qty: 2 },
    { productId: 2, qty: 1 },
  ]);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [received, setReceived] = useState("100.00");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [initialScanned, setInitialScanned] = useState([]);
  const [completedSale, setCompletedSale] = useState(null);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    return products.filter(
      (product) =>
        product.product.toLowerCase().includes(search) ||
        product.barcode.includes(search)
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

  const handleCompleteSale = (event) => {
    event.preventDefault();
    if (!cart.length) {
      setError("Add at least one product to the sale.");
      return;
    }
    if (payment === "Cash" && (!Number.isFinite(Number(received)) || Number(received) < total)) {
      setError(`Amount received must be at least ${formatRand(total)}.`);
      return;
    }

    const stockUpdated = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return {
        product: product.product,
        onHand: product.onHand - item.qty,
      };
    });
    setProducts((current) =>
      current.map((product) => {
        const soldItem = cart.find((item) => item.productId === product.id);
        return soldItem ? { ...product, onHand: product.onHand - soldItem.qty } : product;
      })
    );
    setCompletedSale({
      total,
      payment,
      received: payment === "Cash" ? Number(received) : total,
      change: payment === "Cash" ? change : 0,
      stockUpdated,
      recordedAt: new Date(),
    });
    setCart([]);
    setReceived("");
    setError("");
    setNotice("");
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

  return (
    <div className="staff-sell-layout">
      <Staff_Sidebar alertCount={3} />

      <main className="staff-sell-main">
        <header className="staff-sell-header">
          <h1>New sale</h1>
          <div className="staff-sell-header-actions">
            <span className="staff-sell-sync">Synced 2 min ago</span>
            <StoreOwner_StoreSwitcher stores={[STAFF_STORE]} readOnly />
            <StoreOwner_UserMenu
              name="Lindiwe Ngcobo"
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

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
                  {visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.product}</td>
                      <td>{formatRand(product.price)}</td>
                      <td>
                        <span>{product.onHand}</span>
                        {product.onHand < 15 && <span className="staff-sell-low-stock">Low</span>}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="staff-sell-button staff-sell-add"
                          disabled={quantityInCart(product.id) >= product.onHand}
                          onClick={() => addProductToSale(product)}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
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
