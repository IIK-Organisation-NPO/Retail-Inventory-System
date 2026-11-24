const db = require("../config/db");

// Checks the store belongs to the signed-in owner. Returns the store row or null.
const getOwnedStore = async (conn, storeId, ownerId) => {
  const [rows] = await conn.query(
    "SELECT StoreID, Status FROM STORES WHERE StoreID = ? AND OwnerID = ?",
    [storeId, ownerId]
  );
  return rows[0] || null;
};

// --- RECORD A STOCK MOVEMENT (Stock in, Stock out, Adjustment) ---
// Input is already validated by middleware/validateMovement.js
exports.recordMovement = async (req, res) => {
  const storeId = Number(req.body.storeId);
  const productId = Number(req.body.productId);
  const { type, details } = req.body;
  const ownerId = req.user.id;

  const conn = await db.getConnection();
  try {
    // 1. Store must belong to this owner and be approved
    const store = await getOwnedStore(conn, storeId, ownerId);
    if (!store) return res.status(403).json({ message: "You do not own this store" });
    if (store.Status !== "Approved")
      return res.status(403).json({ message: "This store is not approved yet" });

    await conn.beginTransaction();

    // 2. Lock this product's stock row for this store.
    //    A product only belongs to a store if it has an Inventory row there.
    const [rows] = await conn.query(
      "SELECT InventoryID, Quantity FROM Inventory WHERE StoreID = ? AND ProductID = ? FOR UPDATE",
      [storeId, productId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "This product is not stocked in this store" });
    }
    const current = rows[0].Quantity;

    // 3. Work out the signed change
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

    // 4. Update the inventory row
    await conn.query(
      "UPDATE Inventory SET Quantity = ?, UpdatedAt = NOW() WHERE InventoryID = ?",
      [newQty, rows[0].InventoryID]
    );

    // 5. Log the movement (StaffID must be nullable: ask the DB developers)
    const reason = type === "Adjustment" ? `${details} (was ${current})` : details;
    await conn.query(
      `INSERT INTO InventoryMovement
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

    // onHandAfter = current stock minus every movement that happened after this one.
    // (Window functions need MySQL 8+.)
    const [movements] = await db.query(
      `SELECT id, date, product, type, \`change\`, onHandAfter, \`by\`, details
       FROM (
         SELECT
           m.MovementID   AS id,
           m.CreatedAt    AS date,
           p.ProductName  AS product,
           m.MovementType AS type,
           m.Quantity     AS \`change\`,
           COALESCE(i.Quantity, 0)
             - (SUM(m.Quantity) OVER (
                  PARTITION BY m.StoreID, m.ProductID
                  ORDER BY m.CreatedAt DESC, m.MovementID DESC
                ) - m.Quantity) AS onHandAfter,
           COALESCE(CONCAT(o.Name, ' ', o.Surname), CONCAT(s.Name, ' ', s.Surname)) AS \`by\`,
           m.Reason       AS details
         FROM InventoryMovement m
         JOIN PRODUCTS p ON p.ProductID = m.ProductID
         LEFT JOIN Inventory i ON i.StoreID = m.StoreID AND i.ProductID = m.ProductID
         LEFT JOIN Owner o ON o.OwnerID = m.OwnerID
         LEFT JOIN Staff s ON s.StaffID = m.StaffID
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