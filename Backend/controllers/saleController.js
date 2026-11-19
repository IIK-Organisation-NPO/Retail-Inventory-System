const db = require('../config/db');

// --- RECORD A NEW SALE ---
exports.recordSale = async (req, res) => {
  // We expect the frontend to send the storeId, paymentMethod, and an array of items
  const { storeId, paymentMethod, items } = req.body;
  const staffId = req.user.id; // Assumes owner is logged in (or staff)

  if (!storeId || !items || items.length === 0) {
    return res.status(400).json({ message: "Missing sale data" });
  }

  // Calculate total amount on the server for security
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const connection = await db.getConnection(); // Get a dedicated connection for the transaction

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

    // Commit the transaction if everything succeeded
    await connection.commit();
    res.status(201).json({ message: "Sale recorded successfully", saleId });

  } catch (error) {
    await connection.rollback(); // Undo everything if there was an error
    console.error("RECORD SALE ERROR:", error);
    res.status(500).json({ message: "Failed to record sale. Transaction rolled back." });
  } finally {
    connection.release(); // Always release the connection back to the pool
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
    res.status(500).json({ message: "Database error" });
  }
};