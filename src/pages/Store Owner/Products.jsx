// src/pages/Store Owner/Products.jsx
import { useCallback, useEffect, useState } from "react";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/Products.css";

const API = "http://localhost:5000/api/products";
const MAX_QTY = 100000;

// Validation messages: red, directly under the field they belong to
const ERROR_COLOR = "#c62828";
const errorStyle = { color: ERROR_COLOR, fontSize: "0.85rem", margin: "5px 0 0", display: "block" };
const redBorder = (invalid) => (invalid ? { borderColor: ERROR_COLOR } : undefined);

const FieldError = ({ message }) =>
  message ? (
    <span role="alert" style={errorStyle}>
      {message}
    </span>
  ) : null;

// ---------- helpers (outside the component, they never set state) ----------

// If the server sends no message, the error says which status and address failed
const fetchJson = async (url, token) => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status}) for ${url.replace("http://localhost:5000", "")}`
    );
  }
  return data;
};

// Same status rules as the Inventory page
const getStatus = (onHand, reorder) => {
  if (onHand === 0) return "Out";
  if (onHand < reorder) return "Low";
  return "OK";
};

// Loads the products and maps database columns to what the table expects
const loadProducts = async (storeId, token) => {
  const data = await fetchJson(`${API}?storeId=${storeId}`, token);
  return data.map((p) => {
    const onHand = Number(p.OnHand) || 0;
    const reorder = Number(p.ReorderLevel ?? 15);
    return {
      id: p.ProductID,
      name: p.Name,
      categoryId: p.CategoryID,
      category: p.CategoryName || "Uncategorised",
      unitId: p.UnitOfMeasure,
      unit: p.UnitName || "",
      barcode: p.Barcode,
      cost: `R${Number(p.CostPrice).toFixed(2)}`,
      price: `R${Number(p.SellingPrice).toFixed(2)}`,
      rawCost: p.CostPrice, // plain numbers for the edit form
      rawPrice: p.SellingPrice,
      onHand,
      reorder,
      status: getStatus(onHand, reorder),
    };
  });
};

// The form keys match the names the backend uses, so server messages land on the right field
const emptyForm = {
  name: "",
  barcode: "",
  categoryId: "",
  unitOfMeasure: "",
  costPrice: "",
  sellingPrice: "",
  reorderLevel: "",
  onHand: "",
};

const isBlank = (value) => String(value).trim() === "";

const isWholeNumber = (value, min, max) =>
  !isBlank(value) && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

const isMoney = (value) => !isBlank(value) && !Number.isNaN(Number(value)) && Number(value) >= 0;

// Returns an object like { name: "message" } (empty object = valid)
const validateForm = (form, isEditing) => {
  const errors = {};
  const name = form.name.trim();
  const barcode = form.barcode.trim();

  if (!name) errors.name = "Please enter a product name.";
  else if (name.length > 50) errors.name = "Product name must be 50 characters or less.";

  if (!barcode) errors.barcode = "Please enter or scan the barcode.";
  else if (barcode.length > 50) errors.barcode = "Barcode must be 50 characters or less.";

  if (!form.categoryId) errors.categoryId = "Please select a category.";
  if (!form.unitOfMeasure) errors.unitOfMeasure = "Please select a unit of measure.";

  if (isBlank(form.costPrice)) errors.costPrice = "Please enter the unit cost.";
  else if (!isMoney(form.costPrice)) errors.costPrice = "Unit cost must be 0 or more.";

  if (isBlank(form.sellingPrice)) errors.sellingPrice = "Please enter the selling price.";
  else if (!isMoney(form.sellingPrice)) errors.sellingPrice = "Selling price must be 0 or more.";

  // Cross-field rule: only checked when both prices are valid, so it never hides the messages above
  if (!errors.costPrice && !errors.sellingPrice && Number(form.costPrice) > Number(form.sellingPrice)) {
    errors.costPrice = "Unit cost must be less than the selling price.";
    errors.sellingPrice = "Selling price must be more than the unit cost.";
  }

  if (isBlank(form.reorderLevel)) errors.reorderLevel = "Please enter a reorder level.";
  else if (!isWholeNumber(form.reorderLevel, 0, MAX_QTY))
    errors.reorderLevel = `Enter a whole number between 0 and ${MAX_QTY}.`;

  // Opening stock is only entered when adding a product
  if (!isEditing) {
    if (isBlank(form.onHand)) errors.onHand = "Please enter a quantity.";
    else if (!isWholeNumber(form.onHand, 0, MAX_QTY))
      errors.onHand = `Enter a whole number between 0 and ${MAX_QTY}.`;
  }

  return errors;
};

// ---------- the page ----------

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Data
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [error, setError] = useState("");

  // Form
  const [form, setForm] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get the active store ID (falls back to 1 if not set yet by the Store Switcher)
  const [storeId] = useState(localStorage.getItem("activeStoreId") || 1);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(Boolean(token));

  // --- 1. LOAD PRODUCTS + DROPDOWN LISTS ON PAGE OPEN ---
  // State is only set inside the .then callbacks.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    Promise.all([
      loadProducts(storeId, token),
      fetchJson(`${API}/categories`, token),
      fetchJson(`${API}/units`, token),
    ])
      .then(([productList, categories, units]) => {
        if (cancelled) return;
        setProducts(productList);
        setCategoryOptions(categories);
        setUnitOptions(units);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId, token]);

  // Reload the table after a save (called from the save handler, not from an effect)
  const refreshProducts = useCallback(async () => {
    try {
      setProducts(await loadProducts(storeId, token));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [storeId, token]);

  // --- MODAL OPEN / CLOSE ---
  const resetFormState = () => {
    setValidationErrors({});
    setFormError("");
    setSubmitting(false);
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    resetFormState();
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name ?? "",
      barcode: product.barcode ?? "",
      categoryId: String(product.categoryId ?? ""),
      unitOfMeasure: String(product.unitId ?? ""),
      costPrice: String(product.rawCost ?? ""),
      sellingPrice: String(product.rawPrice ?? ""),
      reorderLevel: String(product.reorder ?? ""),
      onHand: String(product.onHand ?? ""),
    });
    resetFormState();
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    resetFormState();
  };

  // Updates one field and clears its message (and the messages of related fields)
  const setField = (field, alsoClear = []) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev, [field]: "" };
      alsoClear.forEach((key) => {
        next[key] = "";
      });
      return next;
    });
  };

  // --- 2. SAVE PRODUCT TO DATABASE ---
  const handleSaveProduct = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const found = validateForm(form, Boolean(editingProduct));
    setValidationErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return; // stop submission

    const payload = {
      storeId: Number(storeId),
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      categoryId: Number(form.categoryId),
      unitOfMeasure: Number(form.unitOfMeasure),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      reorderLevel: Number(form.reorderLevel),
    };
    // Stock is only set when a product is created. After that it changes
    // through the Inventory page so every change is logged.
    if (!editingProduct) payload.onHand = Number(form.onHand);

    setSubmitting(true);
    try {
      const response = await fetch(editingProduct ? `${API}/${editingProduct.id}` : API, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) {
          // Messages from the server go under the matching fields
          setValidationErrors(data.errors);
          setFormError("Please fix the highlighted fields.");
        } else if (response.status === 409) {
          // Duplicate barcode
          setValidationErrors({ barcode: data.message });
        } else {
          setFormError(data.message || data.error || `Failed to save product (error ${response.status}).`);
        }
        return;
      }

      setSuccessMessage(
        editingProduct
          ? `${payload.name} updated in the product catalogue.`
          : `${payload.name} saved and added to the product catalogue.`
      );
      setSearchTerm("");
      setSelectedCategory("All categories");
      closeProductModal();
      await refreshProducts();
    } catch (err) {
      setFormError(err.message || "Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Filtering Logic ---
  const categories = [...new Set(products.map((product) => product.category))];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.barcode, product.category].some(
      (value) => value && String(value).toLowerCase().includes(normalizedSearchTerm)
    );
    const matchesCategory =
      selectedCategory === "All categories" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="app-layout">
        <StoreOwnerSidebar />
        <main
          className="main-content"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
        >
          <p>Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={products.filter((p) => p.status !== "OK").length} />

      <main className="main-content">
        {/* Page Header */}
        <header className="page-header">
          <h1 className="page-title">Products</h1>

          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div style={{ color: "red", backgroundColor: "#ffebee", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
            {error}
          </div>
        )}

        {/* Filters Row */}
        <div className="filters-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, barcode or category"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="All categories">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Product Catalogue Card */}
        <div className="card products-card">
          <div className="card-header">
            <h3>Product catalogue</h3>
            <button type="button" className="btn-primary" onClick={openAddProductModal}>
              Add product
            </button>
          </div>

          {successMessage && (
            <p className="product-save-notice" role="status" aria-live="polite">
              {successMessage}
            </p>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Barcode</th>
                <th>Unit cost</th>
                <th>Selling price</th>
                <th>On hand</th>
                <th>Reorder level</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.barcode || "N/A"}</td>
                  <td>{product.cost}</td>
                  <td>{product.price}</td>
                  <td>{product.onHand}</td>
                  <td>{product.reorder}</td>
                  <td>
                    <span className={`status-pill ${product.status === "OK" ? "status-neutral" : "status-warning"}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-outline edit-btn"
                      onClick={() => openEditProductModal(product)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-products" style={{ textAlign: "center", padding: "20px" }}>
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* =========================================
          ADD / EDIT PRODUCT MODAL
          ========================================= */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-product-modal">
            {/* Modal Header */}
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeProductModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} noValidate>
              {/* Product Name */}
              <div className="input-group">
                <label htmlFor="product-name">Product name</label>
                <input
                  id="product-name"
                  type="text"
                  className="form-input"
                  style={redBorder(Boolean(validationErrors.name))}
                  value={form.name}
                  onChange={setField("name")}
                />
                <FieldError message={validationErrors.name} />
              </div>

              {/* Category & Barcode Row */}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-category">Category</label>
                  <select
                    id="product-category"
                    className="form-input select-input"
                    style={redBorder(Boolean(validationErrors.categoryId))}
                    value={form.categoryId}
                    onChange={setField("categoryId")}
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((c) => (
                      <option key={c.CategoryID} value={String(c.CategoryID)}>{c.CategoryName}</option>
                    ))}
                  </select>
                  <FieldError message={validationErrors.categoryId} />
                </div>
                <div className="input-group">
                  <label htmlFor="product-barcode">Barcode</label>
                  <input
                    id="product-barcode"
                    type="text"
                    className="form-input"
                    style={redBorder(Boolean(validationErrors.barcode))}
                    placeholder="Scan or type"
                    value={form.barcode}
                    onChange={setField("barcode")}
                  />
                  <FieldError message={validationErrors.barcode} />
                </div>
              </div>

              {/* Unit of Measure & Reorder Level Row */}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-unit">Unit of measure</label>
                  <select
                    id="product-unit"
                    className="form-input select-input"
                    style={redBorder(Boolean(validationErrors.unitOfMeasure))}
                    value={form.unitOfMeasure}
                    onChange={setField("unitOfMeasure")}
                  >
                    <option value="">Select a unit</option>
                    {unitOptions.map((u) => (
                      <option key={u.UnitOfMeasureID} value={String(u.UnitOfMeasureID)}>{u.UnitName}</option>
                    ))}
                  </select>
                  <FieldError message={validationErrors.unitOfMeasure} />
                </div>
                <div className="input-group">
                  <label htmlFor="product-reorder">Reorder level</label>
                  <input
                    id="product-reorder"
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    style={redBorder(Boolean(validationErrors.reorderLevel))}
                    value={form.reorderLevel}
                    onChange={setField("reorderLevel")}
                  />
                  <FieldError message={validationErrors.reorderLevel} />
                </div>
              </div>

              {/* Unit Cost & Selling Price Row */}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-cost">Unit cost (R)</label>
                  <input
                    id="product-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    style={redBorder(Boolean(validationErrors.costPrice))}
                    value={form.costPrice}
                    onChange={setField("costPrice", ["sellingPrice"])}
                  />
                  <FieldError message={validationErrors.costPrice} />
                </div>
                <div className="input-group">
                  <label htmlFor="product-price">Selling price (R)</label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    style={redBorder(Boolean(validationErrors.sellingPrice))}
                    value={form.sellingPrice}
                    onChange={setField("sellingPrice", ["costPrice"])}
                  />
                  <FieldError message={validationErrors.sellingPrice} />
                </div>
              </div>

              {/* Quantity: opening stock when adding, read-only when editing */}
              <div className="input-group">
                <label htmlFor="product-on-hand">
                  {editingProduct ? "Current quantity" : "Opening quantity"}
                </label>
                <input
                  id="product-on-hand"
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  style={redBorder(Boolean(validationErrors.onHand))}
                  value={form.onHand}
                  onChange={setField("onHand")}
                  readOnly={Boolean(editingProduct)}
                  disabled={Boolean(editingProduct)}
                />
                {editingProduct && (
                  <span style={{ display: "block", fontSize: "0.85rem", margin: "5px 0 0", opacity: 0.75 }}>
                    To change stock, use Stock in, Stock out or Adjust stock on the Inventory page.
                  </span>
                )}
                <FieldError message={validationErrors.onHand} />
              </div>

              <FieldError message={formError} />

              {/* Form Actions (Buttons) */}
              <div className="modal-actions">
                <button type="submit" className="btn-primary save-btn" disabled={submitting}>
                  {submitting ? "Saving..." : editingProduct ? "Save changes" : "Save product"}
                </button>
                <button
                  type="button"
                  className="btn-outline cancel-btn"
                  onClick={closeProductModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;