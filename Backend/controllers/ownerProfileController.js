const bcrypt = require("bcryptjs");
const db = require("../config/db");
const sendOTPEmail = require("../config/email");

// Same rule as registration: 8+ chars, upper, lower, number, special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// "+27820000001" / "082 000 0001" -> "0820000001"
const normaliseMobile = (value = "") => {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("27")) digits = "0" + digits.slice(2);
  return digits;
};

// GET /api/owner/profile
// The owner ID comes from the token, so an owner can only read their own profile.
exports.getOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const [rows] = await db.query(
      `SELECT OwnerID, Name, Surname, Email, MobileNumber, IsEmailVerified
       FROM Owner
       WHERE OwnerID = ? AND IsActive = 1`,
      [ownerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Owner not found." });
    }

    const owner = rows[0];
    res.json({
      OwnerID: owner.OwnerID,
      Name: owner.Name,
      Surname: owner.Surname,
      Email: owner.Email,
      MobileNumber: normaliseMobile(owner.MobileNumber),
      IsEmailVerified: owner.IsEmailVerified === 1,
    });
  } catch (err) {
    console.error("getOwnerProfile error:", err);
    res.status(500).json({ message: "Server error while loading profile." });
  }
};

// PUT /api/owner/profile
// Body: { email, mobile }. Name and surname cannot be changed, so they are ignored if sent.
exports.updateOwnerProfile = async (req, res) => {
  const ownerId = req.user.id;

  const email = String(req.body.email || "").trim();
  const mobile = normaliseMobile(req.body.mobile || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (email.length > 50) return res.status(400).json({ message: "Email can be at most 50 characters." });
  if (!/^0\d{9}$/.test(mobile)) return res.status(400).json({ message: "Enter a valid 10-digit mobile number, e.g. 082 000 0000." });

  try {
    const [rows] = await db.query(
      "SELECT Email FROM Owner WHERE OwnerID = ? AND IsActive = 1",
      [ownerId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Owner not found." });
    }

    const emailChanged = rows[0].Email.toLowerCase() !== email.toLowerCase();
    let otp = null;

    if (emailChanged) {
      // New email: it must be verified again, so reset the flag and store a fresh code
      otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60000);

      await db.query(
        `UPDATE Owner
         SET Email = ?, MobileNumber = ?, IsEmailVerified = 0, EmailOTP = ?, EmailOTPExpiry = ?
         WHERE OwnerID = ?`,
        [email, mobile, otp, otpExpiry, ownerId]
      );
    } else {
      // Email unchanged: only the mobile number is updated
      await db.query("UPDATE Owner SET MobileNumber = ? WHERE OwnerID = ?", [mobile, ownerId]);
    }

    let emailSent = false;
    if (emailChanged) {
      try {
        await sendOTPEmail(email, otp);
        emailSent = true;
      } catch (mailErr) {
        console.error("updateOwnerProfile: could not send OTP email:", mailErr);
      }
    }

    res.json({ message: "Profile updated successfully.", emailChanged, emailSent });
  } catch (err) {
    // Email column is UNIQUE, so MySQL rejects an email another owner already uses
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "That email address is already in use." });
    }
    console.error("updateOwnerProfile error:", err);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

// POST /api/owner/resend-email-otp
// Sends a fresh verification code to the owner's current email (used by "Resend code" / "Verify now")
exports.resendEmailOTP = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT Email, IsEmailVerified FROM Owner WHERE OwnerID = ? AND IsActive = 1",
      [ownerId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Owner not found." });
    }
    if (rows[0].IsEmailVerified === 1) {
      return res.status(400).json({ message: "Your email is already verified." });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60000);

    await db.query(
      "UPDATE Owner SET EmailOTP = ?, EmailOTPExpiry = ? WHERE OwnerID = ?",
      [otp, otpExpiry, ownerId]
    );

    await sendOTPEmail(rows[0].Email, otp);
    res.json({ message: "A new verification code was sent to your email." });
  } catch (err) {
    console.error("resendEmailOTP error:", err);
    res.status(500).json({ message: "Could not send the verification code. Please try again." });
  }
};

// PUT /api/owner/change-password
// Body: { currentPassword, newPassword }
exports.changeOwnerPassword = async (req, res) => {
  const ownerId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Enter your current and new password." });
  }
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.",
    });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ message: "Your new password must be different from your current one." });
  }

  try {
    const [rows] = await db.query(
      "SELECT PasswordHash FROM Owner WHERE OwnerID = ? AND IsActive = 1",
      [ownerId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Owner not found." });
    }

    // A wrong current password is a 400 (not 401), so the page doesn't log the owner out
    const isMatch = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Your current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query("UPDATE Owner SET PasswordHash = ? WHERE OwnerID = ?", [hashedPassword, ownerId]);

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("changeOwnerPassword error:", err);
    res.status(500).json({ message: "Server error while changing password." });
  }
};