const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware"); // match your existing import
const {
  getOwnerProfile,
  updateOwnerProfile,
  resendEmailOTP,
  changeOwnerPassword,
} = require("../controllers/ownerProfileController");

router.get("/profile", verifyToken, authorizeRole("OWNER"), getOwnerProfile);
router.put("/profile", verifyToken, authorizeRole("OWNER"), updateOwnerProfile);
router.post("/resend-email-otp", verifyToken, authorizeRole("OWNER"), resendEmailOTP);
router.put("/change-password", verifyToken, authorizeRole("OWNER"), changeOwnerPassword);

module.exports = router;