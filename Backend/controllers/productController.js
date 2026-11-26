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

// --- HELPER: Convert Units Automatically ---
const convertUnit = (unitString) => {
  const cleanString = unitString.trim().toLowerCase();
  const match = cleanString.match(/^([\d.]+)\s*([a-z]+)$/);
  
  if (match) {
    let value = parseFloat(match[1]);
    let unit = match[2];
    
    if (["g", "gram", "grams"].includes(unit) && value >= 1000) {
      value = value / 1000;
      unit = "kg";
    } else if (["ml", "milliliter", "milliliters"].includes(unit) && value >= 1000) {
      value = value / 1000;
      unit = "l";
    } else if (["mg", "milligram", "milligrams"].includes(unit) && value >= 1000) {
      value = value / 1000;
      unit = "g";
    } else if (["kg", "kilogram", "kilograms"].includes(unit)) {
      unit = "kg";
    } else if (["l", "liter", "liters"].includes(unit)) {
      unit = "l";
    } else if (["g", "gram", "grams"].includes(unit)) {
      unit = "g";
    } else if (["ml", "milliliter", "milliliters"].includes(unit)) {
      unit = "ml";
    } else if (["mg", "milligram", "milligrams"].includes(unit)) {
      unit = "mg";
    } else if (["un", "unit", "units", "each", "ea"].includes(unit)) {
      unit = "unit";
    }

    const formattedValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
    return `${formattedValue}${unit}`;
  }

  return unitString;
};

// --- HELPER: Get or Create Unit ID ---
const getOrCreateUnitId = async (unitName) => {
  const convertedName = convertUnit(unitName);
  const cleanName = convertedName.trim();
  if (!cleanName) return null;

  const [existing] = await db.query('SELECT UnitOfMeasureID FROM UnitOfMeasure WHERE UnitName = ?', [cleanName]);
  if (existing.length > 0) {
    return existing[0].UnitOfMeasureID;
  }

  const [result] = await db.query('INSERT INTO UnitOfMeasure (UnitName) VALUES (?)', [cleanName]);
  return result.insertId;
};

// --- ADD A NEW PRODUCT ---
exports.addProduct = async (req, res) => {
  const { storeId, name, categoryId, barcode, unitOfMeasureName, costPrice, sellingPrice, onHand, reorderLevel } = req.body;

  if (!storeId || !name || !categoryId || !unitOfMeasureName || costPrice === undefined || sellingPrice === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const unitId = await getOrCreateUnitId(unitOfMeasureName);

    const [result] = await db.query(
      `INSERT INTO Products 
      (StoreID, Name, CategoryID, Barcode, UnitOfMeasure, CostPrice, SellingPrice, OnHand, ReorderLevel) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [storeId, name, categoryId, barcode || null, unitId, costPrice, sellingPrice, onHand || 0, reorderLevel || 15]
    );

    res.status(201).json({ message: "Product added successfully", productId: result.insertId });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
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
    const unitId = await getOrCreateUnitId(unitOfMeasureName);

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