import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/StoreOwnerStores.css";

const Stores = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dummy data for the stores
  const stores = [
    {
      id: 1,
      name: "Mseleku Tuckshop",
      location: "Pietermaritzburg, KwaZulu-Natal",
      type: "Grocery & essentials",
      staffCount: 6,
      phone: "082 000 0001",
      status: "Active",
    },
    {
      id: 2,
      name: "Riverside General Dealer",
      location: "Durban, KwaZulu-Natal",
      type: "General dealer",
      staffCount: 2,
      phone: "082 000 0003",
      status: "Active",
    },
    {
      id: 3,
      name: "KwaMashu Corner Store",
      location: "KwaMashu, KwaZulu-Natal",
      type: "Grocery & essentials",
      staffCount: 4,
      phone: "082 000 0002",
      status: "Active",
    },
  ];

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      store.name.toLowerCase().includes(normalizedSearchTerm) ||
      store.location.toLowerCase().includes(normalizedSearchTerm);
    const matchesStatus = statusFilter === "all" || store.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

        {/* Stat Cards Row */}
        <div className="stat-cards-grid stores-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total stores</span>
            <div className="stat-value-row">
              <h3 className="stat-value">3</h3>
              <span className="stat-sub">All your locations</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total staff</span>
            <div className="stat-value-row">
              <h3 className="stat-value">12</h3>
              <span className="stat-sub">Across all stores</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active stores</span>
            <div className="stat-value-row">
              <h3 className="stat-value">3</h3>
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
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Stores Grid */}
        <div className="stores-grid">
          
          {/* Map through existing stores */}
          {filteredStores.length === 0 ? (
            <p className="stores-empty">No stores match your filters.</p>
          ) : filteredStores.map((store) => (
            <div key={store.id} className="card store-card">
              
              {/* Card Header */}
              <div className="store-card-header">
                <h3 className="store-name">{store.name}</h3>
                <span className="status-pill status-neutral">{store.status}</span>
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