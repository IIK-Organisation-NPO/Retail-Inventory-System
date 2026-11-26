const jwt = require('jsonwebtoken');

// --- VERIFY TOKEN ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_mvp_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = decoded;
    next();
  });
};

// --- AUTHORIZE ROLES ---
// FIXED: Accepts multiple roles (e.g., authorizeRole('OWNER', 'STAFF'))
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Safety check: make sure the token actually contained a user role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access Denied. User role not found in token." });
    }

    // Check if the logged-in user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied. Requires one of these roles: ${allowedRoles.join(', ')}` 
      });
    }

    // If they have the right role, let them pass
    next();
  };
};

module.exports = { verifyToken, authorizeRole };