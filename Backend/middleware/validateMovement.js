const { validateMovement } = require("../validators/inventoryValidator");

module.exports = (req, res, next) => {
  const { errors, reason } = validateMovement(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  req.body.details = reason; // trimmed
  next();
};