const db = require("../config/db");

class SaleError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const toCents = (value) => Math.round(Number(value) * 100);
const rand = (cents) => `R${(cents / 100).toFixed(2)}`;

const getAuthorizedStore = async (conn, storeId, user) => {
  if (!user || !user.id || !user.role) return null;
  const role = String(user.role).trim().toUpperCase();

  if (role === "OWNER") {
    const [rows] = await conn.query(
      "SELECT StoreID, Status FROM Stores WHERE StoreID = ? AND OwnerID = ?",
      [storeId, user.id]
    );
    return rows[0] || null;
  }

  if (role === "STAFF") {
    const [rows] = await conn.query(
      `SELECT s.StoreID, s.Status
       FROM StoreUsers su
       JOIN Stores s ON s.StoreID = su.StoreID
       WHERE su.StoreID = ?
         AND su.StaffID = ?
         AND su.IsActive = TRUE
         AND su.Status = 'Active'`,
      [storeId, user.id]
    );
    return rows[0] || null;
  }

  return null;
};

// --- RECORD A NEW SALE ---
exports.recordSale = async (req, res) => {
  const storeId = Number(req.body.storeId);
  const { paymentMethod } = req.body;
  const { items, amountPaidCents } = req.sale;
  const role = String(req.user.role || "").trim().toUpperCase();
  const ownerId = role === "OWNER" ? req.user.id : null;
  const staffId = role === "STAFF" ? req.user.id : null;

  const conn = await db.getConnection();
  try {
    const store = await getAuthorizedStore(conn, storeId, req.user);
    if (!store) throw new SaleError(403, "You do not have access to this store");
    if (store.Status !== "Approved") throw new SaleError(403, "This store is not approved yet");

    await conn.beginTransaction();

    const productIds = items.map((i) => i.productId).sort((a, b) => a - b);

    // Lock stock rows
    const [stockRows] = await conn.query(
      `SELECT InventoryID, ProductID, Quantity FROM Inventory
       WHERE StoreID = ? AND ProductID IN (?) ORDER BY ProductID FOR UPDATE`,
      [storeId, productIds]
    );

    // Get product prices
    const [productRows] = await conn.query(
      "SELECT ProductID, ProductName AS Name, SellingPrice FROM Products WHERE ProductID IN (?)",
      [productIds]
    );

    const stockOf = new Map(stockRows.map((r) => [r.ProductID, r]));
    const productOf = new Map(productRows.map((r) => [r.ProductID, r]));

    let totalCents = 0;
    const lines = [];

    for (const item of items) {
      const stock = stockOf.get(item.productId);
      const product = productOf.get(item.productId);

      if (!stock || !product)
        throw new SaleError(404, "A product in this sale is not stocked in this store");

      if (item.quantity > stock.Quantity)
        throw new SaleError(
          409,
          `Not enough stock for ${product.Name}. Only ${stock.Quantity} left.`
        );

      totalCents += toCents(product.SellingPrice) * item.quantity;
      lines.push({ ...item, inventoryId: stock.InventoryID });
    }

    if (totalCents <= 0) throw new SaleError(400, "The sale total must be more than R0.00");

    if (paymentMethod === "Cash" && amountPaidCents < totalCents) {
      const msg = `Amount received must be at least ${rand(totalCents)}.`;
      throw new SaleError(400, msg, { amountPaid: msg });
    }
    if (paymentMethod === "Card" && amountPaidCents !== totalCents) {
      const msg = `The card amount must match the sale total of ${rand(totalCents)}.`;
      throw new SaleError(400, msg, { amountPaid: msg });
    }

    // Insert into Sales (recording either OwnerID or StaffID)
    const [saleResult] = await conn.query(
      `INSERT INTO Sales (StoreID, OwnerID, StaffID, TotalAmount, PaymentMethod, AmountPaid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [storeId, ownerId, staffId, totalCents / 100, paymentMethod, amountPaidCents / 100]
    );
    const saleId = saleResult.insertId;

    // Insert into SalesItem
    await conn.query("INSERT INTO SalesItem (SaleID, ProductID, Quantity) VALUES ?", [
      lines.map((l) => [saleId, l.productId, l.quantity]),
    ]);

    // Reduce stock and log movement
    for (const line of lines) {
      await conn.query(
        "UPDATE Inventory SET Quantity = Quantity - ?, UpdatedAt = NOW() WHERE InventoryID = ?",
        [line.quantity, line.inventoryId]
      );
      await conn.query(
        `INSERT INTO InventoryMovement
           (StoreID, ProductID, OwnerID, StaffID, MovementType, Quantity, Reason)
         VALUES (?, ?, ?, ?, 'Sale', ?, ?)`,
        [storeId, line.productId, ownerId, staffId, -line.quantity, `Sale #${saleId} (${paymentMethod})`]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: "Sale recorded successfully",
      saleId,
      total: totalCents / 100,
      change: paymentMethod === "Cash" ? (amountPaidCents - totalCents) / 100 : 0,
    });
  } catch (error) {
    await conn.rollback().catch(() => {});
    if (error instanceof SaleError) {
      return res.status(error.status).json({ message: error.message, errors: error.errors });
    }
    console.error("RECORD SALE ERROR:", error);
    res.status(500).json({ message: "Failed to record sale. Nothing was saved." });
  } finally {
    conn.release();
  }
};

// --- GET SALES HISTORY ---
exports.getSalesHistory = async (req, res) => {
  const storeId = Number(req.query.storeId);
  if (!Number.isInteger(storeId) || storeId <= 0)
    return res.status(400).json({ message: "Valid storeId is required" });

  try {
    const store = await getAuthorizedStore(db, storeId, req.user);
    if (!store)
      return res.status(403).json({ message: "You do not have access to this store" });

    const [sales] = await db.query(
      `SELECT s.SaleID AS id,
              DATE_FORMAT(s.SaleDate, '%Y-%m-%d') AS date,
              DATE_FORMAT(s.SaleDate, '%H:%i') AS time,
              s.PaymentMethod AS payment,
              s.TotalAmount AS total,
              COALESCE(CONCAT(st.Name, ' ', st.Surname), CONCAT(o.Name, ' ', o.Surname)) AS cashier
       FROM Sales s
       LEFT JOIN Staff st ON st.StaffID = s.StaffID
       LEFT JOIN Owner o ON o.OwnerID = s.OwnerID
       WHERE s.StoreID = ?
       ORDER BY s.SaleDate DESC, s.SaleID DESC
       LIMIT 500`,
      [storeId]
    );

    if (sales.length === 0) return res.status(200).json([]);

    const [itemRows] = await db.query(
      `SELECT si.SaleID, si.ProductID, p.ProductName, si.Quantity
       FROM SalesItem si
       JOIN Products p ON p.ProductID = si.ProductID
       WHERE si.SaleID IN (?)`,
      [sales.map((s) => s.id)]
    );

    const itemsBySale = new Map();
    for (const row of itemRows) {
      if (!itemsBySale.has(row.SaleID)) itemsBySale.set(row.SaleID, []);
      itemsBySale.get(row.SaleID).push({
        productId: row.ProductID,
        name: row.ProductName,
        quantity: row.Quantity,
      });
    }

    res.status(200).json(
      sales.map((s) => {
        const items = itemsBySale.get(s.id) || [];
        return {
          ...s,
          total: Number(s.total),
          items,
          itemsText: items.map((i) => `${i.name} ×${i.quantity}`).join(", "),
        };
      })
    );
  } catch (error) {
    console.error("GET SALES HISTORY ERROR:", error);
    res.status(500).json({ message: "Failed to load sales" });
  }
};

// --- GET TODAY'S SALES ---
exports.getTodaySales = async (req, res) => {
  const storeId = Number(req.query.storeId);
  if (!Number.isInteger(storeId) || storeId <= 0)
    return res.status(400).json({ message: "Valid storeId is required" });

  try {
    const store = await getAuthorizedStore(db, storeId, req.user);
    if (!store)
      return res.status(403).json({ message: "You do not have access to this store" });

    const [sales] = await db.query(
      `SELECT SaleID AS id, SaleDate AS dateTime, PaymentMethod AS payment, TotalAmount AS total
       FROM Sales
       WHERE StoreID = ? AND DATE(SaleDate) = CURDATE()
       ORDER BY SaleDate DESC`,
      [storeId]
    );
    res.status(200).json(sales);
  } catch (error) {
    console.error("GET TODAY'S SALES ERROR:", error);
    res.status(500).json({ message: "Failed to load today's sales" });
  }
};