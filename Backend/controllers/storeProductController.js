const db = require("../config/db");

const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isMoney = (v) => v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v)) && Number(v) >= 0;
const isCount = (v) => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100000;

const ownsStore = async (conn, storeId, ownerId) => {
  const [rows] = await conn.query(
    "SELECT StoreID FROM stores WHERE StoreID = ? AND OwnerID = ?",
    [storeId, ownerId]
  );
  return rows.length > 0;
};

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
    res.status(500).json({ message: "Failed to load categories" });
  }
};

exports.getUnits = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT UnitOfMeasureID, UnitName FROM unitofmeasure ORDER BY UnitName"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("GET UNITS ERROR:", error);
    res.status(500).json({ message: "Failed to load units" });
  }
};

// --- GET PRODUCTS (with stock) FOR A STORE ---
exports.getProducts = async (req, res) => {
  const storeId = Number(req.query.storeId);
  if (!isId(storeId)) return res.status(400).json({ message: "Valid storeId is required" });

  try {
    if (!(await ownsStore(db, storeId, req.user.id)))
      return res.status(403).json({ message: "You do not own this store" });

    const [products] = await db.query(
      `SELECT p.ProductID,
              p.ProductName,
              p.ProductName AS Name,
              p.CategoryID, c.CategoryName,
              p.UnitOfMeasure, u.UnitName,
              p.Barcode, p.SellingPrice,
              p.UnitCost AS CostPrice,
              i.Quantity AS OnHand,
              i.ReorderLevel,
              (SELECT MAX(m.CreatedAt) FROM inventorymovement m
                WHERE m.StoreID = i.StoreID AND m.ProductID = i.ProductID) AS LastMovementDate
       FROM inventory i
       JOIN products p ON p.ProductID = i.ProductID
       LEFT JOIN category c ON c.CategoryID = p.CategoryID
       LEFT JOIN unitofmeasure u ON u.UnitOfMeasureID = p.UnitOfMeasure
       WHERE i.StoreID = ?
       ORDER BY p.ProductName`,
      [storeId]
    );
    res.status(200).json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Failed to load products" });
  }
};

// --- ADD A NEW PRODUCT (product row + inventory row + opening stock) ---
exports.addProduct = async (req, res) => {
  const storeId = Number(req.body.storeId);
  const { categoryId, unitOfMeasure, costPrice, sellingPrice } = req.body;
  const onHand = req.body.onHand === undefined || req.body.onHand === "" ? 0 : Number(req.body.onHand);
  const reorderLevel = req.body.reorderLevel === undefined || req.body.reorderLevel === "" ? 15 : Number(req.body.reorderLevel);

  const { errors, name, barcode } = validateProductBody(req.body);
  if (!isId(storeId)) errors.storeId = "Valid store is required";
  if (!isCount(onHand)) errors.onHand = "Opening stock must be a whole number of 0 or more";
  if (Object.keys(errors).length) return res.status(400).json({ message: "Validation failed", errors });

  const conn = await db.getConnection();
  try {
    if (!(await ownsStore(conn, storeId, req.user.id)))
      return res.status(403).json({ message: "You do not own this store" });

    const lookups = await lookupErrors(conn, categoryId, unitOfMeasure);
    if (Object.keys(lookups).length)
      return res.status(400).json({ message: "Validation failed", errors: lookups });

    // The same barcode can't be used twice in one store
    const [dupes] = await conn.query(
      `SELECT p.ProductID FROM products p
       JOIN inventory i ON i.ProductID = p.ProductID
       WHERE i.StoreID = ? AND p.Barcode = ?`,
      [storeId, barcode]
    );
    if (dupes.length)
      return res.status(409).json({ message: "A product with this barcode already exists in this store" });

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO products (ProductName, CategoryID, UnitCost, SellingPrice, Barcode, UnitOfMeasure)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, Number(categoryId), Number(costPrice), Number(sellingPrice), barcode, Number(unitOfMeasure)]
    );
    const productId = result.insertId;

    await conn.query(
      "INSERT INTO inventory (StoreID, ProductID, Quantity, ReorderLevel) VALUES (?, ?, ?, ?)",
      [storeId, productId, onHand, reorderLevel]
    );

    if (onHand > 0) {
      // StaffID is NULL because the owner made this entry.
      // inventorymovement.StaffID must allow NULL (ALTER TABLE inventorymovement MODIFY StaffID INT NULL).
      await conn.query(
        `INSERT INTO inventorymovement (StoreID, ProductID, OwnerID, StaffID, MovementType, Quantity, Reason)
         VALUES (?, ?, ?, NULL, 'Stock in', ?, 'Opening stock')`,
        [storeId, productId, req.user.id, onHand]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Product added successfully", productId });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: "Failed to add product" });
  } finally {
    conn.release();
  }
};

// --- UPDATE A PRODUCT (details and reorder level only, never stock) ---
exports.updateProduct = async (req, res) => {
  const productId = Number(req.params.productId);
  const storeId = Number(req.body.storeId);
  const { categoryId, unitOfMeasure, costPrice, sellingPrice } = req.body;

  const { errors, name, barcode } = validateProductBody(req.body);
  if (!isId(productId)) errors.productId = "Invalid product";
  if (!isId(storeId)) errors.storeId = "Valid store is required";
  if (Object.keys(errors).length) return res.status(400).json({ message: "Validation failed", errors });

  const conn = await db.getConnection();
  try {
    if (!(await ownsStore(conn, storeId, req.user.id)))
      return res.status(403).json({ message: "You do not own this store" });

    const [stocked] = await conn.query(
      "SELECT InventoryID FROM inventory WHERE StoreID = ? AND ProductID = ?",
      [storeId, productId]
    );
    if (stocked.length === 0) return res.status(404).json({ message: "Product not found in this store" });

    const lookups = await lookupErrors(conn, categoryId, unitOfMeasure);
    if (Object.keys(lookups).length)
      return res.status(400).json({ message: "Validation failed", errors: lookups });

    // Barcode must not clash with another product in this store
    const [dupes] = await conn.query(
      `SELECT p.ProductID FROM products p
       JOIN inventory i ON i.ProductID = p.ProductID
       WHERE i.StoreID = ? AND p.Barcode = ? AND p.ProductID <> ?`,
      [storeId, barcode, productId]
    );
    if (dupes.length)
      return res.status(409).json({ message: "Another product in this store already uses this barcode" });

    await conn.beginTransaction();
    await conn.query(
      `UPDATE products
       SET ProductName = ?, CategoryID = ?, Barcode = ?, UnitOfMeasure = ?, UnitCost = ?, SellingPrice = ?
       WHERE ProductID = ?`,
      [name, Number(categoryId), barcode, Number(unitOfMeasure), Number(costPrice), Number(sellingPrice), productId]
    );
    if (req.body.reorderLevel !== undefined && req.body.reorderLevel !== "") {
      await conn.query(
        "UPDATE inventory SET ReorderLevel = ? WHERE InventoryID = ?",
        [Number(req.body.reorderLevel), stocked[0].InventoryID]
      );
    }
    await conn.commit();
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Failed to update product" });
  } finally {
    conn.release();
  }
};