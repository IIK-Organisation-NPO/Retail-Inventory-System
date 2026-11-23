const db = require('../config/db');

// --- RECORD A NEW SALE ---
exports.recordSale = async (req, res) => {
  const { storeId, paymentMethod, items } = req.body;
  const staffId = req.user.id; 
  const userRole = req.user.role; // 'OWNER' or 'STAFF'

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

    // 2. Loop through items: Insert into SaleItems, deduct stock, and log movement
    for (const item of items) {
      // ONLY process if it is a real product (not a custom "other" item)
      if (item.productId) {
        // Insert line item
        await connection.query(
          `INSERT INTO SaleItems (SaleID, ProductID, Quantity, UnitPrice, Subtotal) VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.productId, item.quantity, item.price, item.price * item.quantity]
        );

        // Fetch current stock and lock the row to prevent race conditions
        const [prod] = await connection.query(
          `SELECT OnHand, Name FROM Products WHERE ProductID = ? AND StoreID = ? FOR UPDATE`,
          [item.productId, storeId]
        );

        if (prod.length === 0) {
          throw new Error(`Product ID ${item.productId} not found in this store.`);
        }

        const newOnHand = prod[0].OnHand - item.quantity;
        const productName = prod[0].Name;

        // Deduct stock
        await connection.query(
          `UPDATE Products SET OnHand = ? WHERE ProductID = ? AND StoreID = ?`,
          [newOnHand, item.productId, storeId]
        );

        // Log the movement (So it shows up in the History page)
        await connection.query(
          `INSERT INTO StockMovements (StoreID, ProductID, Type, QuantityChange, OnHandAfter, Details, RecordedBy) 
           VALUES (?, ?, 'Sale', ?, ?, ?, ?)`,
          [storeId, item.productId, -item.quantity, newOnHand, `${paymentMethod} payment`, userRole]
        );
      }
    }

    // Commit the transaction if everything succeeded
    await connection.commit();
    res.status(201).json({ message: "Sale recorded successfully", saleId });

  } catch (error) {
    await connection.rollback(); // Undo everything if there was an error
    console.error("RECORD SALE ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to record sale. Transaction rolled back." });
  } finally {
    connection.release(); 
  }
};

// --- GET SALES HISTORY (For the Sales Page) ---
exports.getSalesHistory = async (req, res) => {
  const { storeId } = req.query;
  const userRole = req.user.role; // Extracted from JWT middleware
  const userId = req.user.id;     // Extracted from JWT middleware

  try {
    // Base query (used by Owners to see all store sales)
    let query = `
      SELECT 
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
    `;
    
    const queryParams = [storeId];

    // If the logged-in user is Staff, append a condition to only show their own sales
    if (userRole === 'STAFF') {
      query += ` AND s.StaffID = ?`;
      queryParams.push(userId);
    }

    // Complete the query
    query += ` GROUP BY s.SaleID ORDER BY s.SaleDate DESC`;

    // Execute
    const [sales] = await db.query(query, queryParams);
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