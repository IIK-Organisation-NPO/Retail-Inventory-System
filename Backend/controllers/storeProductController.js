const db = require('../config/db');

const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isMoney = (v) => v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v)) && Number(v) >= 0;
const isCount = (v) => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100000;

// Field validation shared by add and update (no database needed)
const validateProductBody = (b) => {
  const errors = {};
  const name = String(b.name || "").trim();
  const barcode = String(b.barcode || "").trim();
  if (!name || name.length > 50) errors.name = "Product name is required (50 characters max)";
  if (!barcode || barcode.length > 50) errors.barcode = "Barcode is required (50 characters max)";
  if (!isId(b.categoryId)) errors.categoryId = "Select a category";
  if (!isId(b.unitOfMeasure)) errors.unitOfMeasure = "Select a unit";
  if (!isMoney(b.costPrice)) errors.costPrice = "Enter a valid cost price";
  if (!isMoney(b.sellingPrice)) errors.sellingPrice = "Enter a valid selling price";
  if (b.reorderLevel !== undefined && b.reorderLevel !== "" && !isCount(b.reorderLevel))
    errors.reorderLevel = "Reorder level must be a whole number of 0 or more";
  return { errors, name, barcode };
};

// Checks the chosen category (must be active) and unit exist in the lookup tables
const lookupErrors = async (conn, categoryId, unitId) => {
  const errors = {};
  const [cats] = await conn.query(
    "SELECT CategoryID FROM category WHERE CategoryID = ? AND IsActive = 1",
    [Number(categoryId)]
  );
  if (cats.length === 0) errors.categoryId = "Selected category does not exist";

  const [units] = await conn.query(
    "SELECT UnitOfMeasureID FROM unitofmeasure WHERE UnitOfMeasureID = ?",
    [Number(unitId)]
  );
  if (units.length === 0) errors.unitOfMeasure = "Selected unit does not exist";
  return errors;
};

// --- DROPDOWN DATA FOR THE ADD / EDIT PRODUCT PAGE ---
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT CategoryID, CategoryName FROM category WHERE IsActive = 1 ORDER BY CategoryName"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- GET ALL UNITS OF MEASURE ---
exports.getUnits = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT UnitOfMeasureID, UnitName FROM unitofmeasure ORDER BY UnitName"
    );
    res.status(200).json(rows);
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
        p.ProductName AS Name,
        p.Barcode,
        p.UnitCost AS CostPrice,
        p.SellingPrice,
        i.Quantity AS OnHand,         -- Stock now comes from Inventory table
        i.ReorderLevel,               -- Reorder Level now comes from Inventory table
        c.CategoryName as Category,
        u.UnitName as Unit,
        p.CategoryID,
        p.UnitOfMeasure as UnitOfMeasureID
      FROM Products p
      INNER JOIN Inventory i ON p.ProductID = i.ProductID
      LEFT JOIN Category c ON p.CategoryID = c.CategoryID
      LEFT JOIN UnitOfMeasure u ON p.UnitOfMeasure = u.UnitOfMeasureID
      WHERE i.StoreID = ?
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
const getOrCreateUnitId = async (conn, unitName) => {
  const convertedName = convertUnit(unitName);
  const cleanName = convertedName.trim();
  if (!cleanName) return null;

  const [existing] = await conn.query('SELECT UnitOfMeasureID FROM UnitOfMeasure WHERE UnitName = ?', [cleanName]);
  if (existing.length > 0) {
    return existing[0].UnitOfMeasureID;
  }

  const [result] = await conn.query('INSERT INTO UnitOfMeasure (UnitName) VALUES (?)', [cleanName]);
  return result.insertId;
};

// --- ADD A NEW PRODUCT ---
exports.addProduct = async (req, res) => {
  const { storeId, name, categoryId, barcode, unitOfMeasureName, costPrice, sellingPrice, onHand, reorderLevel } = req.body;

  if (!storeId || !name || !categoryId || !unitOfMeasureName || costPrice === undefined || sellingPrice === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const conn = await db.getConnection();

  try {
    // 1. Get or create the unit
    const unitId = await getOrCreateUnitId(conn, unitOfMeasureName);

    // 2. Check if category and unit are valid
    const lookups = await lookupErrors(conn, categoryId, unitId);
    if (Object.keys(lookups).length) {
      conn.release(); 
      return res.status(400).json({ message: "Validation failed", errors: lookups });
    }

    // 3. Check for duplicate barcode in THIS store's inventory
    const [dupes] = await conn.query(
      `SELECT p.ProductID FROM Products p
       JOIN Inventory i ON p.ProductID = i.ProductID
       WHERE i.StoreID = ? AND p.Barcode = ?`,
      [storeId, barcode]
    );
    if (dupes.length) {
      conn.release();
      return res.status(409).json({ message: "A product with this barcode already exists in this store" });
    }

    await conn.beginTransaction();

    // 4. Insert Product (No StoreID, No OnHand, No ReorderLevel)
    const [result] = await conn.query(
      `INSERT INTO Products (ProductName, CategoryID, UnitCost, SellingPrice, Barcode, UnitOfMeasure)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, Number(categoryId), Number(costPrice), Number(sellingPrice), barcode, Number(unitId)]
    );
    const productId = result.insertId;

    // 5. Insert Inventory (Links the product to the specific store with initial stock)
    await conn.query(
      "INSERT INTO Inventory (StoreID, ProductID, Quantity, ReorderLevel) VALUES (?, ?, ?, ?)",
      [storeId, productId, onHand || 0, reorderLevel || 15]
    );

    // 6. Log Initial Stock Movement
    if (onHand > 0) {
      await conn.query(
        `INSERT INTO InventoryMovement (StoreID, ProductID, OwnerID, StaffID, MovementType, Quantity, Reason)
         VALUES (?, ?, ?, NULL, 'Stock in', ?, 'Opening stock')`,
        [storeId, productId, req.user.id, onHand]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Product added successfully", productId });

  } catch (error) {
    await conn.rollback();
    console.error("ADD PRODUCT ERROR:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "A product with this barcode already exists." });
    }
    res.status(500).json({ message: "Database error" });
  } finally {
    conn.release();
  }
};

// --- UPDATE A PRODUCT ---
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { storeId, name, categoryId, barcode, unitOfMeasureName, costPrice, sellingPrice, reorderLevel } = req.body;

  const conn = await db.getConnection();

  try {
    const unitId = await getOrCreateUnitId(conn, unitOfMeasureName);

    // Check if this product is actually in this store's inventory
    const [stocked] = await conn.query(
      "SELECT InventoryID FROM Inventory WHERE StoreID = ? AND ProductID = ?",
      [storeId, productId]
    );
    if (stocked.length === 0) {
      conn.release();
      return res.status(404).json({ message: "Product not found in this store" });
    }

    const lookups = await lookupErrors(conn, categoryId, unitId);
    if (Object.keys(lookups).length) {
      conn.release();
      return res.status(400).json({ message: "Validation failed", errors: lookups });
    }

    // Barcode must not clash with another product in this store
    const [dupes] = await conn.query(
      `SELECT p.ProductID FROM Products p
       JOIN Inventory i ON i.ProductID = p.ProductID
       WHERE i.StoreID = ? AND p.Barcode = ? AND p.ProductID <> ?`,
      [storeId, barcode, productId]
    );
    if (dupes.length) {
      conn.release();
      return res.status(409).json({ message: "Another product in this store already uses this barcode" });
    }

    await conn.beginTransaction();
    
    // 1. Update the generic Product info
    await conn.query(
      `UPDATE Products
       SET ProductName = ?, CategoryID = ?, Barcode = ?, UnitOfMeasure = ?, UnitCost = ?, SellingPrice = ?
       WHERE ProductID = ?`,
      [name, categoryId, barcode || null, unitId, costPrice, sellingPrice, productId]
    );

    // 2. Update the Store-specific Inventory info (ReorderLevel)
    if (reorderLevel !== undefined && reorderLevel !== "") {
      await conn.query(
        "UPDATE Inventory SET ReorderLevel = ? WHERE InventoryID = ?",
        [Number(reorderLevel), stocked[0].InventoryID]
      );
    }
    
    await conn.commit();
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    await conn.rollback();
    console.error("UPDATE PRODUCT ERROR:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "A product with this barcode already exists." });
    }
    res.status(500).json({ message: "Database error" });
  } finally {
    conn.release();
  }
};