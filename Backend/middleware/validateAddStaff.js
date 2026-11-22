const { validateStaffInput } = require("../validators/staffValidator");

module.exports = (req, res, next) => {
  const { errors, value } = validateStaffInput(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  req.body = value; // replace the body with the cleaned version
  next();
};