import { useEffect, useState } from "react";
// Reusing the Sidebar component
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
// Importing the stylesheet
import "../../Style/Store Owner/Products.css";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // --- Real Data State ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State for modal validation errors
  const [validationErrors, setValidationErrors] = useState({});
  
  // Get the active store ID (Falls back to 1 if not set yet by Store Switcher)
  const [storeId] = useState(localStorage.getItem("activeStoreId") || 1);

  // --- 1. FETCH PRODUCTS FROM DATABASE ---
  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load products");

      // Map database columns to the format the UI expects
      const formattedProducts = data.map((p) => ({
        id: p.ProductID,
        name: p.Name,
        category: p.Category,
        barcode: p.Barcode,
        unit: p.Unit,
        cost: `R${Number(p.CostPrice).toFixed(2)}`,
        price: `R${Number(p.SellingPrice).toFixed(2)}`,
        onHand: p.OnHand,
        reorder: p.ReorderLevel,
        status: p.OnHand <= p.ReorderLevel ? "Low" : "OK",
        rawCost: p.CostPrice, // Keep raw numbers for editing
        rawPrice: p.SellingPrice
      }));

      setProducts(formattedProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [storeId]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setSuccessMessage("");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setSuccessMessage("");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setValidationErrors({});
  };

  // Clear specific field error as the user types
  const clearError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // --- 2. VALIDATION LOGIC ---
  const validateForm = (formData) => {
    const errors = {};
    const name = formData.get("name")?.trim();
    const unit = formData.get("unit")?.trim();
    const reorder = formData.get("reorder");
    const cost = formData.get("cost");
    const price = formData.get("price");
    const onHand = formData.get("onHand");

    if (!name) {
      errors.name = "Please enter a product name";
    }

    if (!unit) {
      errors.unit = "Please enter a required unit";
    } else {
      // Regex checks for both letters and numbers (e.g., 500ml, 1kg)
      const unitRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).+$/;
      if (!unitRegex.test(unit)) {
        errors.unit = "Please enter unit (e.g. 500ml, 1kg)";
      }
    }

    if (reorder === null || reorder === "") {
      errors.reorder = "Please enter a required level";
    }

    if (cost === null || cost === "") {
      errors.cost = "Enter a required unit cost";
    }

    if (price === null || price === "") {
      errors.price = "Please enter a selling price";
    }

    if (onHand === null || onHand === "") {
      errors.onHand = "Please enter a quantity";
    }

    return errors;
  };

  // --- 3. SAVE PRODUCT TO DATABASE ---
  const handleSaveProduct = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");

    const formData = new FormData(event.currentTarget);
    
    // Run validations
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return; // Stop submission
    }

    setValidationErrors({});

    // Construct the payload exactly as the backend expects it
    const productData = {
      storeId: storeId,
      name: formData.get("name").trim(),
      category: formData.get("category"),
      barcode: formData.get("barcode")?.trim() || null,
      unit: formData.get("unit").trim(),
      costPrice: Number(formData.get("cost")),
      sellingPrice: Number(formData.get("price")),
      onHand: Number(formData.get("onHand")),
      reorderLevel: Number(formData.get("reorder"))
    };

    try {
      let response;
      
      if (editingProduct) {
        // Update Existing Product (PUT)
        response = await fetch(`http://localhost:5000/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      } else {
        // Add New Product (POST)
        response = await fetch("http://localhost:5000/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save product");

      // Success!
      setSuccessMessage(
        editingProduct 
          ? `${productData.name} updated in the product catalogue.` 
          : `${productData.name} saved and added to the product catalogue.`
      );
      
      // Reset filters and close modal
      setSearchTerm("");
      setSelectedCategory("All categories");
      closeProductModal();
      
      // Refresh the data from the DB
      fetchProducts();

    } catch (err) {
      alert(err.message); // Show error message
    }
  };

  // --- Filtering Logic ---
  const categories = [...new Set(products.map((product) => product.category))];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  
  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.barcode, product.category]
      .some((value) => value && value.toLowerCase().includes(normalizedSearchTerm));
    const matchesCategory =
      selectedCategory === "All categories" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="app-layout">
        <StoreOwnerSidebar />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={3} />

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
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
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
            <button
              type="button"
              className="btn-primary"
              onClick={openAddProductModal}
            >
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
                    <span className={`status-pill ${product.status === 'Low' ? 'status-warning' : 'status-neutral'}`}>
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
            <form key={editingProduct?.id ?? "new-product"} onSubmit={handleSaveProduct} noValidate>
              
              {/* Product Name */}
              <div className="input-group">
                <label htmlFor="product-name">Product name</label>
                <input 
                  id="product-name" 
                  name="name" 
                  type="text" 
                  className="form-input" 
                  defaultValue={editingProduct?.name ?? ""} 
                  onChange={() => clearError("name")}
                />
                {validationErrors.name && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.name}</span>}
              </div>

              {/* Category & Barcode Row */}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-category">Category</label>
                  <select id="product-category" name="category" className="form-input select-input" defaultValue={editingProduct?.category ?? "Groceries"}>
                    <option value="Groceries">Groceries</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="product-barcode">Barcode (optional)</label>
                  <input id="product-barcode" name="barcode" type="text" className="form-input" placeholder="Scan or type" defaultValue={editingProduct?.barcode ?? ""} />
                </div>
              </div>

              {/* Unit of Measure & Reorder Level Row */}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-unit">Unit of measure</label>
                  <input 
                    id="product-unit" 
                    name="unit" 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 500ml, 1kg" 
                    defaultValue={editingProduct?.unit ?? ""} 
                    onChange={() => clearError("unit")}
                  />
                  {validationErrors.unit && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.unit}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="product-reorder">Reorder level</label>
                  <input 
                    id="product-reorder" 
                    name="reorder" 
                    type="number" 
                    min="0" 
                    step="1" 
                    className="form-input" 
                    defaultValue={editingProduct?.reorder ?? ""} 
                    onChange={() => clearError("reorder")}
                  />
                  {validationErrors.reorder && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.reorder}</span>}
                </div>
              </div>

              {/* Unit Cost & Selling Price Row */}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-cost">Unit cost (R)</label>
                  {/* We use rawCost for editing so the input gets a plain number like 12.99 instead of R12.99 */}
                  <input 
                    id="product-cost" 
                    name="cost" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    className="form-input" 
                    defaultValue={editingProduct ? editingProduct.rawCost : ""} 
                    onChange={() => clearError("cost")}
                  />
                  {validationErrors.cost && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.cost}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="product-price">Selling price (R)</label>
                  <input 
                    id="product-price" 
                    name="price" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    className="form-input" 
                    defaultValue={editingProduct ? editingProduct.rawPrice : ""} 
                    onChange={() => clearError("price")}
                  />
                  {validationErrors.price && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.price}</span>}
                </div>
              </div>

              {/* Current Quantity */}
              <div className="input-group">
                <label htmlFor="product-on-hand">Current quantity</label>
                <input 
                  id="product-on-hand" 
                  name="onHand" 
                  type="number" 
                  min="0" 
                  step="1" 
                  className="form-input" 
                  defaultValue={editingProduct?.onHand ?? ""} 
                  onChange={() => clearError("onHand")}
                />
                {validationErrors.onHand && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.onHand}</span>}
              </div>

              {/* Form Actions (Buttons) */}
              <div className="modal-actions">
                <button type="submit" className="btn-primary save-btn">
                  {editingProduct ? "Save changes" : "Save product"}
                </button>
                <button 
                  type="button" 
                  className="btn-outline cancel-btn"
                  onClick={closeProductModal}
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