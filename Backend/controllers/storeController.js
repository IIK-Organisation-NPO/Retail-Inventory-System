const db = require('../config/db');

// --- CREATE A NEW STORE ---
exports.createStore = async (req, res) => {
  const { 
    storeName, registrationNumber, contactNumber, email, 
    province, municipality, address 
  } = req.body;

  const ownerId = req.user.id; 

  try {
    // 1. Check if this owner already has a store
    const [existingStore] = await db.query('SELECT * FROM STORES WHERE OwnerID = ?', [ownerId]);
    if (existingStore.length > 0) {
      return res.status(400).json({ message: "You have already registered a store." });
    }

    // 2. Insert the new store
    const [result] = await db.query(
      `INSERT INTO STORES 
      (OwnerID, StoreName, RegistrationNumber, ContactNumber, Email, Province, Municipality, Address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, storeName, registrationNumber, contactNumber, email, province, municipality, address]
    );

    res.status(201).json({ 
      message: "Store application submitted successfully!", 
      storeId: result.insertId 
    });

  } catch (error) {
    console.error("CREATE STORE ERROR:", error);
    res.status(500).json({ message: "Database error while creating store." });
  }
};

// --- GET MY STORES (For Store Switcher and Stores Page) ---
exports.getMyStores = async (req, res) => {
  const ownerId = req.user.id;
  try {
    // We use a subquery to count how many staff members are assigned to each store
    const [stores] = await db.query(`
      SELECT 
        s.*, 
        (SELECT COUNT(*) FROM Staff WHERE StoreID = s.StoreID) as staffCount
      FROM STORES s 
      WHERE s.OwnerID = ? 
      ORDER BY s.CreatedAt DESC
    `, [ownerId]);
    
    res.status(200).json(stores);
  } catch (error) {
    console.error("GET STORES ERROR:", error);
    res.status(500).json({ message: "Database error fetching stores." });
  }
};

// --- GET A SINGLE STORE BY ID (For Editing) ---
exports.getStoreById = async (req, res) => {
  const { storeId } = req.params;
  const ownerId = req.user.id;

  try {
    const [stores] = await db.query(
      'SELECT * FROM STORES WHERE StoreID = ? AND OwnerID = ?', 
      [storeId, ownerId]
    );
    
    if (stores.length === 0) {
      return res.status(404).json({ message: "Store not found or you don't have permission." });
    }
    
    res.status(200).json(stores[0]);
  } catch (error) {
    console.error("GET STORE BY ID ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- UPDATE AN EXISTING STORE ---
exports.updateStore = async (req, res) => {
  const { storeId } = req.params;
  const { 
    storeName, contactNumber, email, province, municipality, address 
  } = req.body;

  const ownerId = req.user.id;

  try {
    // 1. Verify the owner owns this store
    const [existing] = await db.query(
      'SELECT * FROM STORES WHERE StoreID = ? AND OwnerID = ?', 
      [storeId, ownerId]
    );

    if (existing.length === 0) {
      return res.status(403).json({ message: "Store not found or you don't have permission to edit it." });
    }

    // 2. Update the store details and set Status back to 'Pending' for Admin review
    await db.query(
      `UPDATE STORES 
       SET StoreName = ?, ContactNumber = ?, Email = ?, Province = ?, Municipality = ?, Address = ?, Status = 'Pending'
       WHERE StoreID = ?`,
      [storeName, contactNumber, email, province, municipality, address, storeId]
    );

    res.status(200).json({ message: "Store updated successfully. Awaiting Admin approval." });

  } catch (error) {
    console.error("UPDATE STORE ERROR:", error);
    res.status(500).json({ message: "Database error while updating store." });
  }
};