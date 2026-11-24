const { validateSale } = require("../validators/saleValidator");

module.exports = (req, res, next) => {
  const { errors, items, amountPaidCents } = validateSale(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  req.sale = { items, amountPaidCents }; // cleaned data for the controller
  next();
};