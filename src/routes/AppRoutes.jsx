// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your Login page from the auth folder
import Login from '../pages/auth/AdminLogin';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Set the Login page as the default home page for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;