const db = require('../config/db');

// --- RECORD A NEW SALE ---
exports.recordSale = async (req, res) => {
  const { storeId, paymentMethod, items } = req.body;
  const staffId = req.user.id; 

  if (!storeId || !items || items.length === 0) {
    return res.status(400).json({ message: "Missing sale data" });
  }

  // Calculate total amount on the server for security
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const connection = await db.getConnection(); 

  try {
    await connection.beginTransaction();

    // 1. Insert into Sales table
    const [saleResult] = await connection.query(
      `INSERT INTO Sales (StoreID, StaffID, TotalAmount, PaymentMethod) VALUES (?, ?, ?, ?)`,
      [storeId, staffId, totalAmount, paymentMethod]
    );
    const saleId = saleResult.insertId;

    // 2. Loop through items: Insert into SaleItems AND deduct from Products
    for (const item of items) {
      // ONLY process if it is a real product (not a custom "other" item)
      if (item.productId) {
        // Insert line item
        await connection.query(
          `INSERT INTO SaleItems (SaleID, ProductID, Quantity, UnitPrice, Subtotal) VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.productId, item.quantity, item.price, item.price * item.quantity]
        );

        // Deduct stock
        await connection.query(
          `UPDATE Products SET OnHand = OnHand - ? WHERE ProductID = ? AND StoreID = ?`,
          [item.quantity, item.productId, storeId]
        );
      }
    }

    // Commit the transaction if everything succeeded
    await connection.commit();
    res.status(201).json({ message: "Sale recorded successfully", saleId });

  } catch (error) {
    await connection.rollback(); // Undo everything if there was an error
    console.error("RECORD SALE ERROR:", error);
    res.status(500).json({ message: "Failed to record sale. Transaction rolled back." });
  } finally {
    connection.release(); 
  }
};

// --- GET SALES HISTORY (For the Sales Page) ---
exports.getSalesHistory = async (req, res) => {
  const { storeId } = req.query;
  try {
    // We use LEFT JOIN so that sales with custom items still appear in the history
    const [sales] = await db.query(
      `SELECT 
        s.SaleID as id, 
        DATE(s.SaleDate) as date, 
        DATE_FORMAT(s.SaleDate, '%H:%i') as time, 
        s.PaymentMethod as payment, 
        s.TotalAmount as total,
        IFNULL(GROUP_CONCAT(CONCAT(p.Name, ' ×', si.Quantity) SEPARATOR ', '), 'Custom items') as itemsText
       FROM Sales s
       LEFT JOIN SaleItems si ON s.SaleID = si.SaleID
       LEFT JOIN Products p ON si.ProductID = p.ProductID
       WHERE s.StoreID = ?
       GROUP BY s.SaleID
       ORDER BY s.SaleDate DESC`, 
      [storeId]
    );
    res.status(200).json(sales);
  } catch (error) {
    console.error("GET SALES HISTORY ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- GET TODAY'S SALES ---
exports.getTodaySales = async (req, res) => {
  const { storeId } = req.query;
  try {
    const [sales] = await db.query(
      `SELECT * FROM Sales WHERE StoreID = ? AND DATE(SaleDate) = CURDATE() ORDER BY SaleDate DESC`,
      [storeId]
    );
    res.status(200).json(sales);
  } catch (error) {
    console.error("GET TODAY'S SALES ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};