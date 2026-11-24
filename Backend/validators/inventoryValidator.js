const TYPES = ["Stock in", "Stock out", "Adjustment"];
const MAX_QTY = 100000;

const isPosInt = (v) => Number.isInteger(v) && v > 0;

exports.validateMovement = (body) => {
  const errors = {};
  const { storeId, productId, type, quantityChange, newQuantity, details } = body;

  if (!isPosInt(Number(storeId))) errors.storeId = "Valid store is required";
  if (!isPosInt(Number(productId))) errors.productId = "Please select a product";
  if (!TYPES.includes(type)) errors.type = "Invalid movement type";

  const reason = typeof details === "string" ? details.trim() : "";
  if (reason.length > 255) errors.details = "Reason must be 255 characters or less";

  if (type === "Adjustment") {
    // Adjustment sends the counted quantity, not a difference
    const n = Number(newQuantity);
    if (newQuantity === undefined || newQuantity === "" || !Number.isInteger(n) || n < 0 || n > MAX_QTY)
      errors.newQuantity = "Counted quantity must be a whole number of 0 or more";
    if (!reason) errors.details = "A reason is required for adjustments";
  } else if (TYPES.includes(type)) {
    const q = Number(quantityChange);
    if (!Number.isInteger(q) || q === 0 || Math.abs(q) > MAX_QTY)
      errors.quantityChange = `Quantity must be a whole number between 1 and ${MAX_QTY}`;
    else if (type === "Stock in" && q < 0) errors.quantityChange = "Stock in must be positive";
    else if (type === "Stock out" && q > 0) errors.quantityChange = "Stock out must be negative";
    if (type === "Stock out" && !reason) errors.details = "A reason is required for stock out";
  }

  return { errors, reason };
};