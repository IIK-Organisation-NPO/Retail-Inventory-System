// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your Login page from the auth folder
import AdminLogin from '../pages/auth/AdminLogin';
import LoginStoreOwnerStaff from '../pages/auth/LoginStoreOwnerStaff';
import SignupStoreOwner from '../pages/auth/SignupStoreOwner';
import LoginSupplier from '../pages/auth/LoginSupplier';
import SignupSupplier from '../pages/auth/SignupSupplier';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Set the Login page as the default home page for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/login/store-owner-staff" element={<LoginStoreOwnerStaff />} />
        <Route path="/login/supplier" element={<LoginSupplier />} />
        <Route path="/signupstoreowner" element={<SignupStoreOwner />} />
        <Route path="/signupsupplier" element={<SignupSupplier />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;