const db = require('../config/db');

// --- RECORD A STOCK MOVEMENT (IN, OUT, ADJUSTMENT) ---
exports.recordMovement = async (req, res) => {
  const { storeId, productId, type, quantityChange, details } = req.body;
  const recordedBy = req.user.name || "Store Owner"; // Assuming you pass name in JWT, else fallback

  if (!storeId || !productId || !type || !quantityChange) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get current stock
    const [products] = await connection.query(
      'SELECT Name, OnHand FROM Products WHERE ProductID = ? AND StoreID = ?', 
      [productId, storeId]
    );

    if (products.length === 0) {
      throw new Error("Product not found");
    }

    const currentOnHand = products[0].OnHand;
    const newOnHand = currentOnHand + Number(quantityChange);

    if (newOnHand < 0) {
      throw new Error("Stock cannot drop below zero");
    }

    // 2. Update the Product's stock level
    await connection.query(
      'UPDATE Products SET OnHand = ? WHERE ProductID = ?',
      [newOnHand, productId]
    );

    // 3. Log the movement
    await connection.query(
      `INSERT INTO StockMovements 
      (StoreID, ProductID, Type, QuantityChange, OnHandAfter, Details, RecordedBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [storeId, productId, type, quantityChange, newOnHand, details, recordedBy]
    );

    await connection.commit();
    res.status(201).json({ message: "Stock movement recorded", newOnHand });

  } catch (error) {
    await connection.rollback();
    console.error("RECORD MOVEMENT ERROR:", error);
    res.status(500).json({ message: error.message || "Database error" });
  } finally {
    connection.release();
  }
};

// --- GET MOVEMENT HISTORY ---
exports.getMovementHistory = async (req, res) => {
  const { storeId } = req.query;
  try {
    const [movements] = await db.query(
      `SELECT 
        m.MovementID as id, 
        m.CreatedAt as date, 
        p.Name as product, 
        m.Type as type, 
        m.QuantityChange as change, 
        m.OnHandAfter as onHandAfter, 
        m.RecordedBy as by, 
        m.Details as details
       FROM StockMovements m
       JOIN Products p ON m.ProductID = p.ProductID
       WHERE m.StoreID = ?
       ORDER BY m.CreatedAt DESC`,
      [storeId]
    );
    res.status(200).json(movements);
  } catch (error) {
    console.error("GET MOVEMENTS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};