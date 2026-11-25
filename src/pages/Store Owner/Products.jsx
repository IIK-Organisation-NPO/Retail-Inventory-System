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

// --- Category Mapping for Match Validation ---
const categoryKeywords = {
  "Groceries": ["milk", "bread", "rice", "flour", "sugar", "oil", "maize", "meal", "coke", "simba", "chips", "sasko", "rama", "clover", "white star", "food", "drink", "juice", "water", "tea", "coffee", "apple", "banana", "orange", "fruit", "vegetable", "salt", "pepper", "spice", "sauce", "cereal", "snack", "biscuit", "cookie", "candy", "sweet"],
  "Toiletries": ["soap", "shampoo", "toothpaste", "toothbrush", "deodorant", "lotion", "sanitary", "pads", "tissue", "toilet", "shower", "gel", "wash", "cream", "razor", "comb"],
  "Household": ["detergent", "washing", "bleach", "dish", "cleaner", "mop", "broom", "candle", "matches", "batteries", "sponge", "cloth", "trash", "bin", "bag", "foil", "wrap"],
  "Stationery": ["pen", "pencil", "paper", "book", "eraser", "ruler", "sharpener", "notebook", "file", "folder", "glue", "scissors", "tape", "marker", "crayon", "envelope"],
  "Agriculture": ["seed", "fertilizer", "pesticide", "animal", "feed", "chicken", "cow", "goat", "tractor", "hoe", "spade", "shovel", "rake", "watering", "plant", "soil", "compost", "farming"],
  "Hardware": ["hammer", "nails", "screws", "paint", "brush", "wire", "tape", "tool", "wrench", "pliers", "drill", "saw", "bolt", "nut", "hinge", "lock", "key", "sandpaper", "cement", "brick"]
};

const checkCategoryMatch = (productName, selectedCategory) => {
  if (!productName || !selectedCategory) return true;

  const nameLower = productName.toLowerCase();
  
  let matchedCategory = null;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => nameLower.includes(kw))) {
      matchedCategory = cat;
      break; // Stop at the first match found
    }
  }

  // If a keyword was found, but it belongs to a DIFFERENT category than the one selected
  if (matchedCategory && matchedCategory !== selectedCategory) {
    return false;
  }

  return true;
};

// ---------- helpers (outside the component, they never set state) ----------

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

const getStatus = (onHand, reorder) => {
  if (onHand === 0) return "Out";
  if (onHand < reorder) return "Low";
  return "OK";
};

const loadProducts = async (storeId, token) => {
  const data = await fetchJson(`${API}?storeId=${storeId}`, token);
  return data.map((p) => {
    const onHand = Number(p.OnHand) || 0;
    const reorder = Number(p.ReorderLevel ?? 15);
    return {
      id: p.ProductID,
      name: p.Name,
      categoryId: p.CategoryID,
      category: p.Category || "Uncategorised",
      unit: p.UnitName || "", 
      barcode: p.Barcode,
      cost: `R${Number(p.CostPrice).toFixed(2)}`,
      price: `R${Number(p.SellingPrice).toFixed(2)}`,
      rawCost: p.CostPrice,
      rawPrice: p.SellingPrice,
      onHand,
      reorder,
      status: getStatus(onHand, reorder),
    };
  });
};

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

// --- UPDATED VALIDATION FUNCTION ---
const validateForm = (form, isEditing, categoryOptions, editingOnHand) => {
  const errors = {};
  const name = form.name.trim();
  const barcode = form.barcode.trim();

  if (!name) errors.name = "Please enter a product name.";
  else if (name.length > 50) errors.name = "Product name must be 50 characters or less.";

  if (barcode && barcode.length > 50) {
    errors.barcode = "Barcode must be 50 characters or less.";
  }

  if (!form.categoryId) errors.categoryId = "Please select a category.";
  
  // Text validation for Unit
  if (!form.unitOfMeasure) {
    errors.unitOfMeasure = "Please enter a required unit";
  } else {
    const unitRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).+$/;
    if (!unitRegex.test(form.unitOfMeasure)) {
      errors.unitOfMeasure = "Please enter unit (e.g. 500ml, 1kg)";
    }
  }

  if (isBlank(form.costPrice)) errors.costPrice = "Please enter the unit cost.";
  else if (!isMoney(form.costPrice)) errors.costPrice = "Unit cost must be 0 or more.";

  if (isBlank(form.sellingPrice)) errors.sellingPrice = "Please enter the selling price.";
  else if (!isMoney(form.sellingPrice)) errors.sellingPrice = "Selling price must be 0 or more.";

  if (!errors.costPrice && !errors.sellingPrice && Number(form.costPrice) > Number(form.sellingPrice)) {
    errors.costPrice = "Unit cost must be less than the selling price.";
    errors.sellingPrice = "Selling price must be more than the unit cost.";
  }

  if (isBlank(form.reorderLevel)) errors.reorderLevel = "Please enter a reorder level.";
  else if (!isWholeNumber(form.reorderLevel, 0, MAX_QTY))
    errors.reorderLevel = `Enter a whole number between 0 and ${MAX_QTY}.`;

  if (!isEditing) {
    if (isBlank(form.onHand)) errors.onHand = "Please enter a quantity.";
    else if (!isWholeNumber(form.onHand, 0, MAX_QTY))
      errors.onHand = `Enter a whole number between 0 and ${MAX_QTY}.`;
  }

  // NEW: Reorder level must be less than Current quantity
  const compareOnHand = isEditing ? Number(editingOnHand) : Number(form.onHand);
  if (!errors.reorderLevel && !isBlank(compareOnHand) && !isNaN(compareOnHand) && Number(form.reorderLevel) >= compareOnHand) {
    errors.reorderLevel = "Reorder level must be less than a Current quantity";
  }

  // NEW: Category match validation
  if (!errors.name && !errors.categoryId && form.name && form.categoryId) {
    const selectedCatObj = categoryOptions.find(c => String(c.CategoryID) === String(form.categoryId));
    if (selectedCatObj && !checkCategoryMatch(form.name, selectedCatObj.CategoryName)) {
      errors.categoryId = "Selected product does not match category";
    }
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

  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [storeId] = useState(localStorage.getItem("activeStoreId") || 1);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    Promise.all([
      loadProducts(storeId, token),
      fetchJson(`${API}/categories`, token),
    ])
      .then(([productList, categories]) => {
        if (cancelled) return;
        setProducts(productList);
        setCategoryOptions(categories);
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

  const refreshProducts = useCallback(async () => {
    try {
      setProducts(await loadProducts(storeId, token));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [storeId, token]);

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
      unitOfMeasure: product.unit ?? "", 
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

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    if (submitting) return;

    // Pass categoryOptions and editingOnHand to the validator
    const found = validateForm(form, Boolean(editingProduct), categoryOptions, editingProduct?.onHand);
    setValidationErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return; 

    const payload = {
      storeId: Number(storeId),
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      categoryId: Number(form.categoryId),
      unitOfMeasureName: form.unitOfMeasure.trim(), 
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      reorderLevel: Number(form.reorderLevel),
    };
    
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
          setValidationErrors(data.errors);
          setFormError("Please fix the highlighted fields.");
        } else if (response.status === 409) {
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
        <main className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <p>Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={products.filter((p) => p.status !== "OK").length} />

      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Products</h1>
          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {error && (
          <div style={{ color: "red", backgroundColor: "#ffebee", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
            {error}
          </div>
        )}

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
                    <button type="button" className="btn-outline edit-btn" onClick={() => openEditProductModal(product)}>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-product-modal">
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button type="button" className="modal-close-btn" onClick={closeProductModal} aria-label="Close modal">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} noValidate>
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

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-unit">Unit of measure</label>
                  <input
                    id="product-unit"
                    type="text"
                    className="form-input"
                    style={redBorder(Boolean(validationErrors.unitOfMeasure))}
                    placeholder="e.g. 500ml, 1kg"
                    value={form.unitOfMeasure}
                    onChange={setField("unitOfMeasure")}
                  />
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

              <div className="input-group">
                <label htmlFor="product-on-hand">
                 Current quantity
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

              <div className="modal-actions">
                <button type="submit" className="btn-primary save-btn" disabled={submitting}>
                  {submitting ? "Saving..." : editingProduct ? "Save changes" : "Save product"}
                </button>
                <button type="button" className="btn-outline cancel-btn" onClick={closeProductModal} disabled={submitting}>
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