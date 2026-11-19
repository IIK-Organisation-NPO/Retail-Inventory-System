const db = require('../config/db');

// --- ADMIN DASHBOARD ---
exports.getAdminDashboard = async (req, res) => {
  try {
    const [owners] = await db.query('SELECT COUNT(*) AS total FROM Owner');
    const [suppliers] = await db.query('SELECT COUNT(*) AS total FROM Supplier');
    
    let totalStores = 0;
    try {
      const [stores] = await db.query('SELECT COUNT(*) AS total FROM STORES');
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
    console.error("ADMIN DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Error fetching admin stats" });
  }
};

// --- OWNER DASHBOARD ---
exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;
    // The frontend passes the active store ID via the URL query (e.g., ?storeId=1)
    const storeId = req.query.storeId || 1; 
    
    // 1. Fetch Owner Profile
    const [ownerResults] = await db.query('SELECT Name, Surname, Email FROM Owner WHERE OwnerID = ?', [ownerId]);
    if (ownerResults.length === 0) return res.status(404).json({ message: "Owner not found" });
    const owner = ownerResults[0];

    // 2. Initialize Dashboard Data with safe defaults
    let dashboardData = {
      storeName: "My Store",
      alerts: { lowStockCount: 0, newQuotesCount: 0 },
      stats: { 
        todaySales: 0, 
        todayTransactions: 0, 
        inventoryValue: 0, 
        lowStockCount: 0, 
        openRequests: 0 
      },
      salesData: [],
      topSelling: [],
      lowStock: [],
      staff: [],
      procurement: []
    };

    // Try to get the real store name
    try {
      const [storeRes] = await db.query('SELECT StoreName FROM STORES WHERE StoreID = ?', [storeId]);
      if (storeRes.length > 0) dashboardData.storeName = storeRes[0].StoreName;
    } catch (e) { console.log("Could not fetch store name"); }

    // 3. Fetch Inventory Stats (Value, Product Count, Low Stock Count)
    try {
      const [inventory] = await db.query(
        `SELECT 
          COUNT(*) as totalProducts, 
          COALESCE(SUM(OnHand * CostPrice), 0) as totalValue, 
          COALESCE(SUM(CASE WHEN OnHand <= ReorderLevel THEN 1 ELSE 0 END), 0) as lowStock 
         FROM Products WHERE StoreID = ?`, 
        [storeId]
      );
      dashboardData.stats.inventoryValue = inventory[0].totalValue;
      dashboardData.stats.lowStockCount = inventory[0].lowStock;
      dashboardData.alerts.lowStockCount = inventory[0].lowStock;
    } catch (e) { console.log("Inventory table not ready or empty"); }

    // 4. Fetch Today's Sales Stats
    try {
      const [todayStats] = await db.query(
        `SELECT COUNT(*) as transactions, COALESCE(SUM(TotalAmount), 0) as sales 
         FROM Sales WHERE StoreID = ? AND DATE(SaleDate) = CURDATE()`, 
        [storeId]
      );
      dashboardData.stats.todayTransactions = todayStats[0].transactions;
      dashboardData.stats.todaySales = Number(todayStats[0].sales);
    } catch (e) { console.log("Sales table not ready or empty"); }

    // 5. Fetch Sales Chart Data (Last 7 Days)
    try {
      const [salesChart] = await db.query(
        `SELECT DATE_FORMAT(SaleDate, '%a') as day, SUM(TotalAmount) as amount 
         FROM Sales 
         WHERE StoreID = ? AND SaleDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(SaleDate) ORDER BY SaleDate ASC`, 
        [storeId]
      );
      
      // If there's real data, use it. Otherwise, return a blank chart.
      if (salesChart.length > 0) {
        dashboardData.salesData = salesChart;
      }
    } catch (e) { console.log("Sales chart query failed"); }

    // 6. Fetch Top Selling Products (Today)
    try {
      const [topSelling] = await db.query(
        `SELECT p.Name as product, SUM(si.Quantity) as sold 
         FROM SaleItems si
         JOIN Products p ON si.ProductID = p.ProductID
         JOIN Sales s ON si.SaleID = s.SaleID
         WHERE s.StoreID = ? AND DATE(s.SaleDate) = CURDATE()
         GROUP BY p.ProductID ORDER BY sold DESC LIMIT 3`, 
        [storeId]
      );
      dashboardData.topSelling = topSelling;
    } catch (e) { console.log("Top selling query failed"); }

    // 7. Fetch Low Stock Products (Top 5)
    try {
      const [lowStock] = await db.query(
        `SELECT Name as product, OnHand as inStock, ReorderLevel as reorder 
         FROM Products WHERE StoreID = ? AND OnHand <= ReorderLevel LIMIT 5`, 
        [storeId]
      );
      dashboardData.lowStock = lowStock;
    } catch (e) { console.log("Low stock query failed"); }

    // 8. Fetch Staff List
    try {
      const [staffResults] = await db.query(
        'SELECT StaffID as id, Name as name, Surname as surname, Role as role, IsActive FROM Staff WHERE StoreID = ?', 
        [storeId]
      );
      dashboardData.staff = staffResults.map(s => ({
        ...s,
        status: s.IsActive ? 'Active' : 'Disabled'
      }));
    } catch (e) { console.log("Staff table not ready yet."); }

    // 9. Send the combined response to the frontend
    res.status(200).json({
      message: `Welcome back, ${owner.Name}!`,
      profile: { 
        fullName: `${owner.Name} ${owner.Surname}`, 
        email: owner.Email,
        storeName: dashboardData.storeName 
      },
      dashboardData: dashboardData
    });

  } catch (error) {
    console.error("OWNER DASHBOARD ERROR:", error);
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
    console.error("SUPPLIER DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};