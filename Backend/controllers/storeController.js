const db = require('../config/db');
const { isValidRegNumber, lookupCompany } = require('../services/cipcService');

// --- CREATE A NEW STORE ---
exports.createStore = async (req, res) => {
  const { 
    storeName, registrationNumber, contactNumber, email, province, address, 
    operatingHours, logoBase64, logoName, logoType // Added logo fields
  } = req.body;
  
  // The page calls this field "storeLocation"; the database column is "Municipality"
  const municipality = req.body.municipality || req.body.storeLocation;

  const ownerId = req.user.id;

  try {
    // PART A: Check the owner sent everything and nothing is too long
    const name = (storeName || '').trim();
    const regNumber = (registrationNumber || '').trim();
    const contact = (contactNumber || '').trim();
    const mail = (email || '').trim();
    const prov = (province || '').trim();
    const muni = (municipality || '').trim();
    const addr = (address || '').trim();
    const hours = (operatingHours || 'Not provided').trim();

    if (!name || !regNumber || !contact || !mail || !prov || !muni || !addr) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (name.length > 50 || mail.length > 50 || muni.length > 50 || addr.length > 50 ||
        contact.length > 20 || prov.length > 20) {
      return res.status(400).json({ message: 'One or more fields are too long. Name, email, area and address are limited to 50 characters.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!isValidRegNumber(regNumber)) {
      return res.status(400).json({ message: 'Invalid registration number. Use the format YYYY/NNNNNN/NN.' });
    }

    // PART B: Stop the same owner saving the same store name twice
    const [sameName] = await db.query(
      'SELECT StoreID FROM STORES WHERE OwnerID = ? AND StoreName = ?',
      [ownerId, name]
    );
    if (sameName.length > 0) {
      return res.status(409).json({ message: 'You already have a store with this name.' });
    }

    // PART C: Check the company with CIPC again, on the server
    const company = await lookupCompany(regNumber);
    if (!company) {
      return res.status(404).json({ message: 'No company found for this registration number.' });
    }
    if (String(company.status).toLowerCase() !== 'in business') {
      return res.status(400).json({ message: 'This company is not in business, so a store cannot be registered.' });
    }

    // PART D: Process the Logo (Convert Base64 string to Buffer for LONGBLOB)
    let logoBuffer = null;
    if (logoBase64) {
      // Remove the data:image/png;base64, prefix
      const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
      logoBuffer = Buffer.from(base64Data, 'base64');
    }

    // PART E: Save. Status is left out on purpose: the database fills in 'Pending'.
    const [result] = await db.query(
      `INSERT INTO STORES
      (OwnerID, StoreName, RegistrationNumber, ContactNumber, Email, Province, Municipality, Address, OperatingHours, StoreLogo, LogoFileName, LogoFileType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, name, regNumber, contact, mail, prov, muni, addr, hours, logoBuffer, logoName || null, logoType || null]
    );

    res.status(201).json({
      message: 'Store application submitted successfully!',
      storeId: result.insertId
    });

  } catch (error) {
    console.error('CREATE STORE ERROR:', error);
    res.status(500).json({ message: 'Database error while creating store.' });
  }
};

// --- GET MY STORES (For Store Switcher and Stores Page) ---
// Returns ONLY approved stores for an OWNER, or active assigned approved stores for STAFF.
exports.getMyStores = async (req, res) => {
  try {
    const role = String(req.user.role || '').trim().toUpperCase();

    if (role === 'OWNER') {
      const [stores] = await db.query(
        "SELECT StoreID, StoreName, LogoFileName FROM Stores WHERE OwnerID = ? AND Status = 'Approved'",
        [req.user.id]
      );
      return res.status(200).json(stores);
    }

    if (role === 'STAFF') {
      const [stores] = await db.query(
        `SELECT DISTINCT s.StoreID, s.StoreName, s.LogoFileName
         FROM StoreUsers su
         JOIN Stores s ON s.StoreID = su.StoreID
         WHERE su.StaffID = ?
           AND su.IsActive = TRUE
           AND su.Status = 'Active'
           AND s.Status = 'Approved'`,
        [req.user.id]
      );
      return res.status(200).json(stores);
    }

    return res.status(403).json({ message: 'Access denied.' });
  } catch (error) {
    console.error("GET STORES ERROR:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// --- GET A SINGLE STORE BY ID (For Editing) ---
exports.getStoreById = async (req, res) => {
  const { storeId } = req.params;
  const ownerId = req.user.id;

  try {
    // We don't select StoreLogo (LONGBLOB) here to prevent sending a massive file to the frontend.
    // We only send the metadata. If the frontend needs the image, it can hit a separate endpoint.
    const [stores] = await db.query(
      `SELECT StoreID, OwnerID, StoreName, RegistrationNumber, ContactNumber, Email, 
              Province, Municipality, Address, OperatingHours, Status, LogoFileName, LogoFileType 
       FROM STORES WHERE StoreID = ? AND OwnerID = ?`,
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
// Status rules (so an owner cannot undo an admin's decision by editing):
//   Suspended -> cannot be edited; the owner must contact support.
//   Rejected  -> goes back to Pending (this is the owner sending it again).
//   Pending / Approved -> keep their current status.
exports.updateStore = async (req, res) => {
  const { storeId } = req.params;
  const {
    storeName, contactNumber, email, province, municipality, address, operatingHours,
    logoBase64, logoName, logoType // Added logo fields for updating
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

    const currentStatus = existing[0].Status;

    if (currentStatus === 'Suspended') {
      return res.status(403).json({
        message: 'This store has been suspended, so it cannot be edited. Contact support.',
        code: 'STORE_NOT_ACTIVE',
        storeStatus: 'Suspended',
      });
    }

    const nextStatus = currentStatus === 'Rejected' ? 'Pending' : currentStatus;

    // 2. Prepare the update query
    let updateQuery = `
      UPDATE STORES
      SET StoreName = ?, ContactNumber = ?, Email = ?, Province = ?, Municipality = ?, Address = ?, OperatingHours = ?, Status = ?
    `;
    let queryParams = [storeName, contactNumber, email, province, municipality, address, operatingHours, nextStatus];

    // 3. If a new logo was uploaded, add it to the query
    if (logoBase64) {
      const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
      const logoBuffer = Buffer.from(base64Data, 'base64');
      
      updateQuery += `, StoreLogo = ?, LogoFileName = ?, LogoFileType = ?`;
      queryParams.push(logoBuffer, logoName || null, logoType || null);
    }

    updateQuery += ` WHERE StoreID = ?`;
    queryParams.push(storeId);

    // 4. Execute the update
    await db.query(updateQuery, queryParams);

    res.status(200).json({
      message:
        nextStatus === 'Pending'
          ? 'Store updated successfully. Awaiting Admin approval.'
          : 'Store updated successfully.',
      status: nextStatus,
    });

  } catch (error) {
    console.error("UPDATE STORE ERROR:", error);
    res.status(500).json({ message: "Database error while updating store." });
  }
};

// --- GET STORE LOGO IMAGE ---
// This streams the binary image directly to the browser so <img> tags can display it.
exports.getStoreLogo = async (req, res) => {
  const { storeId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT StoreLogo, LogoFileType FROM STORES WHERE StoreID = ?',
      [storeId]
    );

    if (rows.length === 0 || !rows[0].StoreLogo) {
      return res.status(404).send('No logo found');
    }

    // Set the correct image type (e.g., image/png) so the browser displays it
    res.setHeader('Content-Type', rows[0].LogoFileType || 'image/png');
    
    // Send the binary buffer directly
    res.send(rows[0].StoreLogo);
  } catch (error) {
    console.error("GET STORE LOGO ERROR:", error);
    res.status(500).send('Server error');
  }
};