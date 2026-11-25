const db = require('../config/db');

// --- GET ALL CATEGORIES ---
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM Category WHERE IsActive = TRUE');
    res.status(200).json(categories);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- GET ALL UNITS OF MEASURE ---
exports.getUnits = async (req, res) => {
  try {
    const [units] = await db.query('SELECT * FROM UnitOfMeasure');
    res.status(200).json(units);
  } catch (error) {
    console.error("GET UNITS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- GET ALL PRODUCTS FOR A STORE ---
exports.getProducts = async (req, res) => {
  const { storeId } = req.query;

  if (!storeId) {
    return res.status(400).json({ message: "Store ID is required" });
  }

  try {
    const [products] = await db.query(`
      SELECT 
        p.ProductID,
        p.Name,
        p.Barcode,
        p.CostPrice,
        p.SellingPrice,
        p.OnHand,
        p.ReorderLevel,
        c.CategoryName as Category,
        u.UnitName as Unit,
        p.CategoryID,
        p.UnitOfMeasure as UnitOfMeasureID
      FROM Products p
      LEFT JOIN Category c ON p.CategoryID = c.CategoryID
      LEFT JOIN UnitOfMeasure u ON p.UnitOfMeasure = u.UnitOfMeasureID
      WHERE p.StoreID = ?
    `, [storeId]);
    
    res.status(200).json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- HELPER: Get or Create Unit ID ---
// This looks up the text string (e.g., "500ml") in the DB. 
// If it doesn't exist, it creates it and returns the new ID.
const getOrCreateUnitId = async (unitName) => {
  const cleanName = unitName.trim();
  if (!cleanName) return null;

  // Check if it exists
  const [existing] = await db.query('SELECT UnitOfMeasureID FROM UnitOfMeasure WHERE UnitName = ?', [cleanName]);
  if (existing.length > 0) {
    return existing[0].UnitOfMeasureID;
  }

  // If not, create it
  const [result] = await db.query('INSERT INTO UnitOfMeasure (UnitName) VALUES (?)', [cleanName]);
  return result.insertId;
};

// --- ADD A NEW PRODUCT ---
exports.addProduct = async (req, res) => {
  // The frontend sends 'unitOfMeasureName' as a text string now
  const { storeId, name, categoryId, barcode, unitOfMeasureName, costPrice, sellingPrice, onHand, reorderLevel } = req.body;

  if (!storeId || !name || !categoryId || !unitOfMeasureName || costPrice === undefined || sellingPrice === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1. Resolve the Unit Name to an ID
    const unitId = await getOrCreateUnitId(unitOfMeasureName);

    // 2. Insert the product
    const [result] = await db.query(
      `INSERT INTO Products 
      (StoreID, Name, CategoryID, Barcode, UnitOfMeasure, CostPrice, SellingPrice, OnHand, ReorderLevel) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [storeId, name, categoryId, barcode || null, unitId, costPrice, sellingPrice, onHand || 0, reorderLevel || 15]
    );

    res.status(201).json({ message: "Product added successfully", productId: result.insertId });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    // Handle duplicate barcode error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "A product with this barcode already exists." });
    }
    res.status(500).json({ message: "Database error" });
  }
};

// --- UPDATE A PRODUCT ---
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { name, categoryId, barcode, unitOfMeasureName, costPrice, sellingPrice, reorderLevel } = req.body;

  try {
    // 1. Resolve the Unit Name to an ID
    const unitId = await getOrCreateUnitId(unitOfMeasureName);

    // 2. Update the product (We do NOT update OnHand here, as it's read-only in the UI)
    await db.query(
      `UPDATE Products 
       SET Name = ?, CategoryID = ?, Barcode = ?, UnitOfMeasure = ?, CostPrice = ?, SellingPrice = ?, ReorderLevel = ? 
       WHERE ProductID = ?`,
      [name, categoryId, barcode || null, unitId, costPrice, sellingPrice, reorderLevel, productId]
    );

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "A product with this barcode already exists." });
    }
    res.status(500).json({ message: "Database error" });
  }
};