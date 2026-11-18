// src/routes/AppRoutes.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your Login page from the auth folder
import AdminLogin from '../pages/auth/AdminLogin';
import LoginStoreOwnerStaff from '../pages/auth/LoginStoreOwnerStaff';
import SignupStoreOwner from '../pages/auth/SignupStoreOwner';
import LoginSupplier from '../pages/auth/LoginSupplier';
import SignupSupplier from '../pages/auth/SignupSupplier';
import StoreOwner_Dashboard from "../pages/Store Owner/StoreOwner_Dashboard";
import Products from "../pages/Store Owner/Products";
import StoreOwnerNotifications from "../pages/Store Owner/StoreOwnerNotifications";
import StoreOwnerStores from "../pages/Store Owner/StoreOwnerStores";
import RegisterStore from "../pages/Store Owner/RegisterStore";
import CompanyInformation from "../pages/Store Owner/CompanyInformation";
import StoreProfile from "../pages/Store Owner/StoreProfile";
import ReviewStore from "../pages/Store Owner/ReviewStore";
import EditStore from "../pages/Store Owner/EditStore";

// Store Owner pages
import StoreOwnerInventory from '../pages/Store Owner/StoreOwnerInventory';
import StoreOwner_MovementHistory from '../pages/Store Owner/StoreOwner_MovementHistory';
import StoreOwner_Sales from '../pages/Store Owner/StoreOwner_Sales';
import StoreOwner_Staff from '../pages/Store Owner/StoreOwner_Staff';
import StoreOwner_Profile from '../pages/Store Owner/StoreOwner_Profile';
import StoreOwner_Settings from '../pages/Store Owner/StoreOwner_Settings';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Set the Login page as the default home page for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<StoreOwner_Dashboard />} />
        <Route path="/login/store-owner-staff" element={<LoginStoreOwnerStaff />} />
        <Route path="/login/supplier" element={<LoginSupplier />} />
        <Route path="/signupstoreowner" element={<SignupStoreOwner />} />
        <Route path="/signupsupplier" element={<SignupSupplier />} />

        {/* Store Owner */}
        <Route path="/store-owner/dashboard" element={<StoreOwner_Dashboard />} />
        <Route path="/store-owner/products" element={<Products />} />
        <Route path="/store-owner/inventory" element={<StoreOwnerInventory />} />
        <Route path="/store-owner/inventory/movement-history" element={<StoreOwner_MovementHistory />} />
        <Route path="/store-owner/sales" element={<StoreOwner_Sales />} />
        <Route path="/store-owner/staff" element={<StoreOwner_Staff />} />
        <Route path="/store-owner/profile" element={<StoreOwner_Profile />} />
        <Route path="/store-owner/settings" element={<StoreOwner_Settings />} />
        
      </Routes>
    </Router>
  );
};

export default AppRoutes;