const db = require('../config/db');
const { buildLast7Days } = require('../services/dashboardService');

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

    // 1. The frontend must say which store (?storeId=1). No more silent default to store 1.
    const storeId = Number(req.query.storeId);
    if (!Number.isInteger(storeId) || storeId <= 0) {
      return res.status(400).json({ message: "A valid storeId is required" });
    }

    // 2. Fetch Owner Profile
    const [ownerResults] = await db.query('SELECT Name, Surname, Email FROM Owner WHERE OwnerID = ?', [ownerId]);
    if (ownerResults.length === 0) return res.status(404).json({ message: "Owner not found" });
    const owner = ownerResults[0];

    // 3. Make sure this store belongs to this owner (the ownership check)
    const [storeRes] = await db.query(
      'SELECT StoreName, Status FROM STORES WHERE StoreID = ? AND OwnerID = ?',
      [storeId, ownerId]
    );
    if (storeRes.length === 0) return res.status(404).json({ message: "Store not found" });

    // 4. Safe defaults
    let dashboardData = {
      storeName: storeRes[0].StoreName,
      storeStatus: storeRes[0].Status, // lets the frontend show a "pending approval" notice if needed
      alerts: { lowStockCount: 0, newQuotesCount: 0 },
      stats: {
        todaySales: 0,
        todayTransactions: 0,
        inventoryValue: 0,
        productCount: 0,
        lowStockCount: 0,
        openRequests: 0
      },
      salesData: buildLast7Days([]), // 7 bars of 0 until real sales exist
      topSelling: [],
      lowStock: [],
      staff: [],
      procurement: []
    };

    // 5. Inventory stats
    try {
      const [inventory] = await db.query(
        `SELECT
          COUNT(*) AS totalProducts,
          COALESCE(SUM(OnHand * CostPrice), 0) AS totalValue,
          COALESCE(SUM(CASE WHEN OnHand <= ReorderLevel THEN 1 ELSE 0 END), 0) AS lowStock
         FROM Products WHERE StoreID = ?`,
        [storeId]
      );
      dashboardData.stats.inventoryValue = Number(inventory[0].totalValue);
      dashboardData.stats.productCount = inventory[0].totalProducts;
      dashboardData.stats.lowStockCount = Number(inventory[0].lowStock);
      dashboardData.alerts.lowStockCount = Number(inventory[0].lowStock);
    } catch (e) { console.log("Inventory query failed:", e.message); }

    // 6. Today's sales
    try {
      const [todayStats] = await db.query(
        `SELECT COUNT(*) AS transactions, COALESCE(SUM(TotalAmount), 0) AS sales
         FROM Sales
         WHERE StoreID = ? AND SaleDate >= CURDATE() AND SaleDate < CURDATE() + INTERVAL 1 DAY`,
        [storeId]
      );
      dashboardData.stats.todayTransactions = todayStats[0].transactions;
      dashboardData.stats.todaySales = Number(todayStats[0].sales);
    } catch (e) { console.log("Today's sales query failed:", e.message); }

    // 7. Last 7 days chart (GROUP BY the alias so MySQL 8 accepts it)
    try {
      const [salesChart] = await db.query(
        `SELECT DATE_FORMAT(SaleDate, '%Y-%m-%d') AS date, SUM(TotalAmount) AS amount
         FROM Sales
         WHERE StoreID = ? AND SaleDate >= CURDATE() - INTERVAL 6 DAY
         GROUP BY date`,
        [storeId]
      );
      dashboardData.salesData = buildLast7Days(salesChart); // always exactly 7 days, 0 where no sales
    } catch (e) { console.log("Sales chart query failed:", e.message); }

    // 8. Top selling today
    try {
      const [topSelling] = await db.query(
        `SELECT p.Name AS product, SUM(si.Quantity) AS sold
         FROM SaleItems si
         JOIN Products p ON si.ProductID = p.ProductID
         JOIN Sales s ON si.SaleID = s.SaleID
         WHERE s.StoreID = ? AND s.SaleDate >= CURDATE() AND s.SaleDate < CURDATE() + INTERVAL 1 DAY
         GROUP BY p.ProductID, p.Name
         ORDER BY sold DESC LIMIT 3`,
        [storeId]
      );
      dashboardData.topSelling = topSelling.map(t => ({ ...t, sold: Number(t.sold) }));
    } catch (e) { console.log("Top selling query failed:", e.message); }

    // 9. Low stock products (emptiest first), with the status label the page needs
    try {
      const [lowStock] = await db.query(
        `SELECT Name AS product, OnHand AS inStock, ReorderLevel AS reorder
         FROM Products
         WHERE StoreID = ? AND OnHand <= ReorderLevel
         ORDER BY OnHand ASC LIMIT 5`,
        [storeId]
      );
      dashboardData.lowStock = lowStock.map(p => ({
        ...p,
        status: p.inStock === 0 ? 'Out of stock' : 'Low'
      }));
    } catch (e) { console.log("Low stock query failed:", e.message); }

    // 10. Staff list. FIXED: Join with StoreUsers to get IsActive and filter by StoreID.
    try {
      const [staffResults] = await db.query(`
        SELECT 
          s.StaffID AS id, 
          s.Name AS name, 
          s.Surname AS surname, 
          s.Role AS role, 
          su.IsActive 
        FROM Staff s
        INNER JOIN StoreUsers su ON s.StaffID = su.StaffID
        WHERE su.StoreID = ?
      `, [storeId]);
      
      dashboardData.staff = staffResults.map(s => ({
        ...s,
        status: s.IsActive ? 'Active' : 'Disabled'
      }));
    } catch (e) { console.log("Staff query failed:", e.message); }

    // 11. Send the combined response
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