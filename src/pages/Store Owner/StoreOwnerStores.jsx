import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/StoreOwnerStores.css";

const Stores = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Real Data State
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // --- 1. FETCH STORES FROM BACKEND ---
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stores/my-stores", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load stores");

        // Map the database response to the frontend's expected structure
        const formattedStores = data.map(store => ({
          id: store.StoreID,
          name: store.StoreName,
          // Cleanly join address parts, ignoring any that are null/empty
          location: [store.Address, store.Municipality, store.Province].filter(Boolean).join(", "),
          type: "Grocery & essentials", // Default type for now
          staffCount: store.staffCount || 0,
          phone: store.ContactNumber,
          status: store.Status || "Active",
        }));

        setStores(formattedStores);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStores();
  }, [token]);

  // --- 2. DYNAMIC STAT CALCULATIONS ---
  const totalStores = stores.length;
  const totalStaff = stores.reduce((sum, store) => sum + store.staffCount, 0);
  const activeStores = stores.filter(store => store.status === "Active").length;

  // --- 3. FILTERING ---
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      store.name.toLowerCase().includes(normalizedSearchTerm) ||
      store.location.toLowerCase().includes(normalizedSearchTerm);
    const matchesStatus = statusFilter === "all" || store.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status Pill Color Helper
  const getStatusClass = (status) => {
    if (status === "Active") return "status-success";
    if (status === "Pending") return "status-warning";
    return "status-danger";
  };

  if (loading) {
    return (
      <div className="app-layout">
        <StoreOwnerSidebar />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading your stores...</p>
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
          <div>
            <h1 className="page-title">Stores</h1>
            <p className="page-subtitle">Manage your stores, details and team in one place.</p>
          </div>
          
          <div className="header-actions">
            <StoreOwner_StoreSwitcher stores={stores} />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {/* Stat Cards Row */}
        <div className="stat-cards-grid stores-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total stores</span>
            <div className="stat-value-row">
              <h3 className="stat-value">{totalStores}</h3>
              <span className="stat-sub">All your locations</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total staff</span>
            <div className="stat-value-row">
              <h3 className="stat-value">{totalStaff}</h3>
              <span className="stat-sub">Across all stores</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active stores</span>
            <div className="stat-value-row">
              <h3 className="stat-value">{activeStores}</h3>
              <span className="stat-sub">Ready to trade</span>
            </div>
          </div>
        </div>

        {/* Section Header & Filters */}
        <div className="section-header">
          <h2 className="section-title">Your stores</h2>
          <span className="section-count">
            • {filteredStores.length} {filteredStores.length === 1 ? "store" : "stores"}
          </span>
        </div>

        <div className="filters-row stores-filters-row">
          <input 
            type="search" 
            className="search-input" 
            placeholder="Search by store name or location" 
            aria-label="Search stores by name or location"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="filter-select stores-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter stores by status"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Stores Grid */}
        <div className="stores-grid">
          
          {/* Map through existing stores */}
          {filteredStores.length === 0 ? (
            <p className="stores-empty" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
              No stores match your filters.
            </p>
          ) : filteredStores.map((store) => (
            <div key={store.id} className="card store-card">
              
              {/* Card Header */}
              <div className="store-card-header">
                <h3 className="store-name">{store.name}</h3>
                <span className={`status-pill ${getStatusClass(store.status)}`}>
                  {store.status}
                </span>
              </div>
              
              <p className="store-location">{store.location}</p>
              <p className="store-type">{store.type}</p>
              
              {/* Divider */}
              <div className="store-card-divider"></div>
              
              {/* Card Footer */}
              <div className="store-card-footer">
                <div className="store-meta">
                  <span className="store-staff">{store.staffCount} staff members</span>
                  <span className="store-phone">{store.phone}</span>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate(`/store-owner/stores/edit/${store.id}`)}
                >
                  Edit store
                </button>
              </div>
            </div>
          ))}

          {/* Special "Register Store" Card */}
          <div className="card register-store-card">
            <h3 className="register-title">Ready to add another store?</h3>
            <p className="register-desc">
              Start with a CIPC registration number, then create your store profile and add your team.
            </p>
            <button
              type="button"
              className="btn-primary register-btn"
              onClick={() => navigate("/store-owner/stores/register")}
            >
              + Register a store
            </button>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Stores;