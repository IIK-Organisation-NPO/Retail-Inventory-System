const db = require('../config/db');

// --- SALES REPORT ---
exports.getSalesReport = async (req, res) => {
  const { storeId } = req.query;
  try {
    // 1. Summary Stats
    const [summary] = await db.query(
      `SELECT 
        COALESCE(SUM(TotalAmount), 0) as totalSales,
        COUNT(SaleID) as totalTransactions,
        COALESCE(AVG(TotalAmount), 0) as averageSale
       FROM Sales WHERE StoreID = ?`,
      [storeId]
    );

    // 2. Chart Data (Sales per day)
    const [chartData] = await db.query(
      `SELECT 
         DATE_FORMAT(SaleDate, '%a') as day, 
         SUM(TotalAmount) as amount 
       FROM Sales 
       WHERE StoreID = ? 
       GROUP BY DATE(SaleDate), DATE_FORMAT(SaleDate, '%a') 
       ORDER BY DATE(SaleDate) ASC 
       LIMIT 7`,
      [storeId]
    );

    // 3. Top Products
    const [topProducts] = await db.query(
      `SELECT p.ProductName as name, SUM(si.Quantity) as units 
       FROM SaleItems si
       JOIN Products p ON si.ProductID = p.ProductID
       JOIN Sales s ON si.SaleID = s.SaleID
       WHERE s.StoreID = ? 
       GROUP BY p.ProductID, p.ProductName 
       ORDER BY units DESC 
       LIMIT 5`,
      [storeId]
    );

    // 4. Payment Methods
    const [payments] = await db.query(
      `SELECT PaymentMethod as method, SUM(TotalAmount) as amount 
       FROM Sales 
       WHERE StoreID = ? 
       GROUP BY PaymentMethod`,
      [storeId]
    );

    res.status(200).json({
      summary: summary[0],
      chartData,
      topProducts,
      payments
    });
  } catch (error) {
    console.error("SALES REPORT ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- INVENTORY REPORT ---
exports.getInventoryReport = async (req, res) => {
  const { storeId } = req.query;
  try {
    // 1. Summary Stats
    // FIXED: Now joins Inventory and Products because StoreID, Quantity, and ReorderLevel 
    // are no longer inside the Products table.
    const [summary] = await db.query(
      `SELECT 
        COUNT(i.ProductID) as totalProducts,
        COALESCE(SUM(i.Quantity * p.UnitCost), 0) as inventoryValue,
        COALESCE(SUM(CASE WHEN i.Quantity <= i.ReorderLevel AND i.Quantity > 0 THEN 1 ELSE 0 END), 0) as lowStock,
        COALESCE(SUM(CASE WHEN i.Quantity = 0 THEN 1 ELSE 0 END), 0) as outOfStock
       FROM Inventory i
       JOIN Products p ON i.ProductID = p.ProductID
       WHERE i.StoreID = ?`,
      [storeId]
    );

    // 2. Lowest stock items
    // FIXED: Now joins Inventory to get the correct Quantity and ProductName
    const [lowStockItems] = await db.query(
      `SELECT p.ProductName as name, i.Quantity 
       FROM Inventory i
       JOIN Products p ON i.ProductID = p.ProductID
       WHERE i.StoreID = ? AND i.Quantity <= i.ReorderLevel 
       ORDER BY i.Quantity ASC LIMIT 5`,
      [storeId]
    );

    res.status(200).json({
      summary: summary[0],
      lowStockItems
    });
  } catch (error) {
    console.error("INVENTORY REPORT ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};