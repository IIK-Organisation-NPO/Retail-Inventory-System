const db = require('../config/db');

// --- ADMIN DASHBOARD ---
exports.getAdminDashboard = async (req, res) => {
  try {
    const [owners] = await db.query('SELECT COUNT(*) AS total FROM Owner');
    const [suppliers] = await db.query('SELECT COUNT(*) AS total FROM Supplier');
    
    let totalStores = 0;
    try {
      const [stores] = await db.query('SELECT COUNT(*) AS total FROM Stores');
      totalStores = stores[0].total;
    } catch (e) {
      // Ignore if Stores table doesn't exist yet
    }

    res.status(200).json({
      message: "Welcome to the Admin Dashboard",
      stats: {
        totalOwners: owners[0].total,
        totalSuppliers: suppliers[0].total,
        totalStores: totalStores
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin stats" });
  }
};

// --- OWNER DASHBOARD ---
exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const [results] = await db.query('SELECT Name, Surname, Email FROM Owner WHERE OwnerID = ?', [ownerId]);
    
    if (results.length === 0) return res.status(404).json({ message: "Owner not found" });

    const owner = results[0];
    res.status(200).json({
      message: `Welcome back, ${owner.Name}!`,
      profile: { fullName: `${owner.Name} ${owner.Surname}`, email: owner.Email },
      stats: { todaySales: 0, lowStockItems: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

// --- SUPPLIER DASHBOARD ---
exports.getSupplierDashboard = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const [results] = await db.query('SELECT CompanyName, Name FROM Supplier WHERE SupplierID = ?', [supplierId]);
    
    if (results.length === 0) return res.status(404).json({ message: "Supplier not found" });

    const supplier = results[0];
    res.status(200).json({
      message: `Welcome back, ${supplier.CompanyName}!`,
      profile: { companyName: supplier.CompanyName, contactPerson: supplier.Name },
      stats: { pendingRequests: 0, submittedQuotes: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};