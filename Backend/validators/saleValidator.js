const METHODS = ["Cash", "Card"];
const MAX_QTY = 100000;
const MAX_LINES = 100;

// True if the number has at most 2 decimal places (cents)
const isCents = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

exports.validateSale = (body) => {
  const errors = {};
  const { storeId, paymentMethod, items, amountPaid } = body;

  if (!Number.isInteger(Number(storeId)) || Number(storeId) <= 0)
    errors.storeId = "Valid store is required";

  if (!METHODS.includes(paymentMethod))
    errors.paymentMethod = "Payment method must be Cash or Card";

  // Items: same product on several lines is merged into one
  const merged = new Map();
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "Add at least one item to the sale";
  } else if (items.length > MAX_LINES) {
    errors.items = `A sale can have at most ${MAX_LINES} lines`;
  } else {
    for (const item of items) {
      const productId = Number(item?.productId);
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(productId) || productId <= 0) {
        errors.items = "Every item must be a product from the product list";
        break;
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
        errors.items = `Quantity must be a whole number between 1 and ${MAX_QTY}`;
        break;
      }
      merged.set(productId, (merged.get(productId) || 0) + quantity);
    }
  }

  // One field for both methods: cash received, or the amount charged on the card machine
  const paid = Number(amountPaid);
  if (
    amountPaid === undefined ||
    amountPaid === null ||
    String(amountPaid).trim() === "" ||
    Number.isNaN(paid) ||
    paid <= 0 ||
    paid > 10000000 ||
    !isCents(paid)
  ) {
    errors.amountPaid =
      paymentMethod === "Card"
        ? "Enter the amount charged on the speed point"
        : "Enter the amount received";
  }

  return {
    errors,
    items: [...merged].map(([productId, quantity]) => ({ productId, quantity })),
    amountPaidCents: Math.round(paid * 100),
  };
};