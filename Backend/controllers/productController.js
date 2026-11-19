const db = require('../config/db');

// --- GET ALL PRODUCTS FOR A STORE ---
exports.getProducts = async (req, res) => {
  const { storeId } = req.query; // Get storeId from URL params

  if (!storeId) {
    return res.status(400).json({ message: "Store ID is required" });
  }

  try {
    // Note: In a production app, you should verify this owner actually owns this storeId first
    const [products] = await db.query('SELECT * FROM Products WHERE StoreID = ?', [storeId]);
    res.status(200).json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- ADD A NEW PRODUCT ---
exports.addProduct = async (req, res) => {
  const { storeId, name, category, barcode, unit, costPrice, sellingPrice, onHand, reorderLevel } = req.body;

  if (!storeId || !name || !costPrice || !sellingPrice) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Products 
      (StoreID, Name, Category, Barcode, Unit, CostPrice, SellingPrice, OnHand, ReorderLevel) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [storeId, name, category, barcode, unit, costPrice, sellingPrice, onHand || 0, reorderLevel || 15]
    );

    res.status(201).json({ message: "Product added successfully", productId: result.insertId });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- UPDATE A PRODUCT ---
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { name, category, barcode, unit, costPrice, sellingPrice, onHand, reorderLevel } = req.body;

  try {
    await db.query(
      `UPDATE Products 
       SET Name = ?, Category = ?, Barcode = ?, Unit = ?, CostPrice = ?, SellingPrice = ?, OnHand = ?, ReorderLevel = ? 
       WHERE ProductID = ?`,
      [name, category, barcode, unit, costPrice, sellingPrice, onHand, reorderLevel, productId]
    );

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};