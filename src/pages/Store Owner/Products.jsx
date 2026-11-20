import { useState } from "react";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/Products.css";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [products, setProducts] = useState([
    { id: "seed-1", name: "Simba Chips Original", category: "Snacks", barcode: "6001240200018", cost: "R12.99", price: "R14.63", onHand: 38, reorder: 15, status: "OK" },
    { id: "seed-2", name: "Lay's Salt & Vinegar", category: "Snacks", barcode: "6001240200025", cost: "R14.99", price: "R20.39", onHand: 24, reorder: 15, status: "OK" },
    { id: "seed-3", name: "NikNaks Cheese", category: "Snacks", barcode: "6001240200032", cost: "R11.99", price: "R15.00", onHand: 66, reorder: 15, status: "OK" },
    { id: "seed-4", name: "Coca-Cola 500ml", category: "Drinks", barcode: "5449000000996", cost: "R18.99", price: "R26.50", onHand: 89, reorder: 15, status: "OK" },
    { id: "seed-5", name: "Fanta Orange 500ml", category: "Drinks", barcode: "5449000050205", cost: "R17.99", price: "R20.55", onHand: 12, reorder: 15, status: "Low" },
    { id: "seed-6", name: "Sprite 500ml", category: "Drinks", barcode: "5449000014535", cost: "R17.99", price: "R21.45", onHand: 55, reorder: 15, status: "OK" },
  ]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    // Null-safe: get() can return null if the field is missing/unchecked
    const name = (formData.get("name") ?? "").toString().trim();
    const category = formData.get("category") ?? "Groceries";
    const barcode = (formData.get("barcode") ?? "").toString().trim();
    const onHand = Number(formData.get("onHand") ?? 0);
    const reorder = Number(formData.get("reorder") ?? 0);
    const cost = Number(formData.get("cost") ?? 0);
    const price = Number(formData.get("price") ?? 0);

    const savedProduct = {
      id: editingProduct?.id ?? `product-${Date.now()}`,
      name,
      category,
      barcode,
      unit: (formData.get("unit") ?? "").toString().trim(),
      cost: `R${cost.toFixed(2)}`,
      price: `R${price.toFixed(2)}`,
      onHand,
      reorder,
      status: onHand <= reorder ? "Low" : "OK",
    };

    if (editingProduct) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id ? savedProduct : product
        )
      );
      setSuccessMessage(`${name} updated in the product catalogue.`);
    } else {
      setProducts((currentProducts) => [savedProduct, ...currentProducts]);
      setSuccessMessage(`${name} saved and added to the product catalogue.`);
    }

    setSearchTerm("");
    setSelectedCategory("All categories");
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const categories = [...new Set(products.map((product) => product.category))];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    // Null-safe search across all searchable fields
    const matchesSearch = [product.name, product.barcode, product.category]
      .some((value) => (value ?? "").toString().toLowerCase().includes(normalizedSearchTerm));
    const matchesCategory =
      selectedCategory === "All categories" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Products</h1>
          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

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
                    <span className={`status-pill ${product.status === "Low" ? "status-warning" : "status-neutral"}`}>
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
                  <td colSpan={9} className="empty-products">
                    No products match your search and category filter.
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
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeProductModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form key={editingProduct?.id ?? "new-product"} onSubmit={handleSaveProduct}>
              <div className="input-group">
                <label htmlFor="product-name">Product name</label>
                <input id="product-name" name="name" type="text" className="form-input" defaultValue={editingProduct?.name ?? ""} required />
              </div>

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

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-unit">Unit of measure</label>
                  <input id="product-unit" name="unit" type="text" className="form-input" defaultValue={editingProduct?.unit ?? ""} required />
                </div>
                <div className="input-group">
                  <label htmlFor="product-reorder">Reorder level</label>
                  <input id="product-reorder" name="reorder" type="number" min="0" step="1" className="form-input" defaultValue={editingProduct?.reorder ?? ""} required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="product-cost">Unit cost (R)</label>
                  <input id="product-cost" name="cost" type="number" min="0" step="0.01" className="form-input" defaultValue={editingProduct ? Number(editingProduct.cost.replace(/[^\d.]/g, "")) : ""} required />
                </div>
                <div className="input-group">
                  <label htmlFor="product-price">Selling price (R)</label>
                  <input id="product-price" name="price" type="number" min="0" step="0.01" className="form-input" defaultValue={editingProduct ? Number(editingProduct.price.replace(/[^\d.]/g, "")) : ""} required />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="product-on-hand">Current quantity</label>
                <input id="product-on-hand" name="onHand" type="number" min="0" step="1" className="form-input" defaultValue={editingProduct?.onHand ?? ""} required />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary save-btn">
                  {editingProduct ? "Save changes" : "Save product"}
                </button>
                <button type="button" className="btn-outline cancel-btn" onClick={closeProductModal}>
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