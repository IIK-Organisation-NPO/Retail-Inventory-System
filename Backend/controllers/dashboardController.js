const db = require('../config/db');

// --- ADMIN DASHBOARD ---
exports.getAdminDashboard = (req, res) => {
  const queries = {
    owners: 'SELECT COUNT(*) AS total FROM Owner',
    suppliers: 'SELECT COUNT(*) AS total FROM Supplier',
    stores: 'SELECT COUNT(*) AS total FROM Stores'
  };

  db.query(queries.owners, (err, ownerResult) => {
    if (err) return res.status(500).json({ message: "Error fetching owners" });
    db.query(queries.suppliers, (err, supplierResult) => {
      if (err) return res.status(500).json({ message: "Error fetching suppliers" });
      db.query(queries.stores, (err, storeResult) => {
        const totalStores = err ? 0 : storeResult[0].total;
        res.status(200).json({
          message: "Welcome to the Admin Dashboard",
          stats: {
            totalOwners: ownerResult[0].total,
            totalSuppliers: supplierResult[0].total,
            totalStores: totalStores
          }
        });
      });
    });
  });
};

// --- OWNER DASHBOARD ---
exports.getOwnerDashboard = (req, res) => {
  const ownerId = req.user.id;
  const query = 'SELECT Name, Surname, Email FROM Owner WHERE OwnerID = ?';

  db.query(query, [ownerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Owner not found" });

    const owner = results[0];
    res.status(200).json({
      message: `Welcome back, ${owner.Name}!`,
      profile: { fullName: `${owner.Name} ${owner.Surname}`, email: owner.Email },
      stats: { todaySales: 0, lowStockItems: 0 }
    });
  });
};

// --- SUPPLIER DASHBOARD ---
exports.getSupplierDashboard = (req, res) => {
  const supplierId = req.user.id;
  const query = 'SELECT CompanyName, Name FROM Supplier WHERE SupplierID = ?';

  db.query(query, [supplierId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Supplier not found" });

    const supplier = results[0];
    res.status(200).json({
      message: `Welcome back, ${supplier.CompanyName}!`,
      profile: { companyName: supplier.CompanyName, contactPerson: supplier.Name },
      stats: { pendingRequests: 0, submittedQuotes: 0 }
    });
  });
};