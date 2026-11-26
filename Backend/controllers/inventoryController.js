const db = require("../config/db");

// Checks the store belongs to the signed-in owner. Returns the store row or null.
const getOwnedStore = async (conn, storeId, ownerId) => {
  const [rows] = await conn.query(
    "SELECT StoreID, Status FROM stores WHERE StoreID = ? AND OwnerID = ?",
    [storeId, ownerId]
  );
  return rows[0] || null;
};

// --- RECORD A STOCK MOVEMENT ---
exports.recordMovement = async (req, res) => {
  const storeId = Number(req.body.storeId);
  const productId = Number(req.body.productId);
  const { type, details } = req.body;
  const ownerId = req.user.id;

  const conn = await db.getConnection();
  try {
    const store = await getOwnedStore(conn, storeId, ownerId);
    if (!store) return res.status(403).json({ message: "You do not own this store" });
    if (store.Status !== "Approved")
      return res.status(403).json({ message: "This store is not approved yet" });

    await conn.beginTransaction();

    // 2. Lock this product's stock row for this store.
    //    A product only belongs to a store if it has an inventory row there.
    const [rows] = await conn.query(
      "SELECT InventoryID, Quantity FROM inventory WHERE StoreID = ? AND ProductID = ? FOR UPDATE",
      [storeId, productId]
    );
    
    // If it doesn't exist in Inventory yet, create it based on the Product's OnHand
    if (rows.length === 0) {
      const [prodRows] = await conn.query("SELECT OnHand FROM Products WHERE ProductID = ? AND StoreID = ?", [productId, storeId]);
      if (prodRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: "Product not found" });
      }
      
      await conn.query(
        "INSERT INTO Inventory (StoreID, ProductID, Quantity, ReorderLevel) VALUES (?, ?, ?, ?)",
        [storeId, productId, prodRows[0].OnHand, 15]
      );
      
      const [newRows] = await conn.query(
        "SELECT InventoryID, Quantity FROM Inventory WHERE StoreID = ? AND ProductID = ? FOR UPDATE",
        [storeId, productId]
      );
      rows.push(newRows[0]);
    }

    const current = rows[0].Quantity;

    // 2. Work out the signed change
    const change =
      type === "Adjustment"
        ? Number(req.body.newQuantity) - current
        : Number(req.body.quantityChange);
        
    const newQty = current + change;

    if (change === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "This would not change the stock level" });
    }
    if (newQty < 0) {
      await conn.rollback();
      return res.status(409).json({ message: `Not enough stock. Only ${current} on hand.` });
    }

    // 3. Update the inventory row
    await conn.query(
      "UPDATE inventory SET Quantity = ?, UpdatedAt = NOW() WHERE InventoryID = ?",
      [newQty, rows[0].InventoryID]
    );

    // 5. Log the movement.
    //    StaffID is NULL because the owner made this entry.
    //    inventorymovement.StaffID must allow NULL (ALTER TABLE inventorymovement MODIFY StaffID INT NULL).
    const reason = type === "Adjustment" ? `${details} (was ${current})` : details;
    await conn.query(
      `INSERT INTO inventorymovement
         (StoreID, ProductID, OwnerID, StaffID, MovementType, Quantity, Reason)
       VALUES (?, ?, ?, NULL, ?, ?, ?)`,
      [storeId, productId, ownerId, type, change, reason || null]
    );

    await conn.commit();
    res.status(201).json({ message: "Stock movement recorded", newOnHand: newQty });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("RECORD MOVEMENT ERROR:", error);
    res.status(500).json({ message: "Failed to update stock" });
  } finally {
    conn.release();
  }
};

// --- GET MOVEMENT HISTORY ---
exports.getMovementHistory = async (req, res) => {
  const storeId = Number(req.query.storeId);
  if (!Number.isInteger(storeId) || storeId <= 0)
    return res.status(400).json({ message: "Valid storeId is required" });

  try {
    const store = await getOwnedStore(db, storeId, req.user.id);
    if (!store) return res.status(403).json({ message: "You do not own this store" });

    // FIXED: Changed 'PRODUCTS' to 'Products' and 'p.ProductName' to 'p.Name'
    const [movements] = await db.query(
      `SELECT id, date, product, type, \`change\`, onHandAfter, \`by\`, details
       FROM (
         SELECT
           m.MovementID   AS id,
           m.CreatedAt    AS date,
           p.Name         AS product, 
           m.MovementType AS type,
           m.Quantity     AS \`change\`,
           COALESCE(i.Quantity, 0)
             - (SUM(m.Quantity) OVER (
                  PARTITION BY m.StoreID, m.ProductID
                  ORDER BY m.CreatedAt DESC, m.MovementID DESC
                ) - m.Quantity) AS onHandAfter,
           COALESCE(CONCAT(o.Name, ' ', o.Surname), CONCAT(s.Name, ' ', s.Surname)) AS \`by\`,
           m.Reason       AS details
         FROM inventorymovement m
         JOIN products p ON p.ProductID = m.ProductID
         LEFT JOIN inventory i ON i.StoreID = m.StoreID AND i.ProductID = m.ProductID
         LEFT JOIN owner o ON o.OwnerID = m.OwnerID
         LEFT JOIN staff s ON s.StaffID = m.StaffID
         WHERE m.StoreID = ?
       ) t
       ORDER BY date DESC, id DESC
       LIMIT 200`,
      [storeId]
    );
    res.status(200).json(movements);
  } catch (error) {
    console.error("GET MOVEMENTS ERROR:", error);
    res.status(500).json({ message: "Failed to load movement history" });
  }
};