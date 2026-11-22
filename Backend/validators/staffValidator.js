const ALLOWED_ROLES = ["Cashier", "Stock clerk"];
const ALLOWED_GENDERS = ["male", "female"];

// Letters (including accented ones), with single spaces, hyphens or apostrophes between parts
const NAME_REGEX = /^\p{L}+(?:[ '’-]\p{L}+)*$/u;

// South African mobile numbers: 06x, 07x or 08x followed by 7 more digits
const MOBILE_REGEX = /^0[6-8]\d{8}$/;

// Turns "+27 82 000 0001" or "27820000001" into "0820000001"
function normaliseMobile(input) {
  let digits = String(input ?? "").replace(/[\s\-()]/g, "");
  if (digits.startsWith("+27")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("27") && digits.length === 11) digits = "0" + digits.slice(2);
  return digits;
}

function validateStaffInput(body = {}) {
  const errors = {};

  const name = String(body.name ?? "").trim();
  const surname = String(body.surname ?? "").trim();
  const gender = String(body.gender ?? "").trim().toLowerCase();
  const role = String(body.role ?? "").trim();
  const mobile = normaliseMobile(body.mobile);

  if (!name) errors.name = "Name is required";
  else if (name.length < 2 || name.length > 50) errors.name = "Name must be 2 to 50 characters";
  else if (!NAME_REGEX.test(name)) errors.name = "Name can only contain letters, spaces, hyphens and apostrophes";

  if (!surname) errors.surname = "Surname is required";
  else if (surname.length < 2 || surname.length > 50) errors.surname = "Surname must be 2 to 50 characters";
  else if (!NAME_REGEX.test(surname)) errors.surname = "Surname can only contain letters, spaces, hyphens and apostrophes";

  if (!mobile) errors.mobile = "Mobile number is required";
  else if (!MOBILE_REGEX.test(mobile)) errors.mobile = "Enter a valid South African mobile number, e.g. 0821234567";

  if (!ALLOWED_GENDERS.includes(gender)) errors.gender = `Gender must be one of: ${ALLOWED_GENDERS.join(", ")}`;

  if (!ALLOWED_ROLES.includes(role)) errors.role = `Role must be one of: ${ALLOWED_ROLES.join(", ")}`;

  // Only these fields are returned. Anything else the frontend sent (like status or storeId) is dropped.
  return { errors, value: { name, surname, mobile, gender, role } };
}

module.exports = { validateStaffInput, normaliseMobile, ALLOWED_ROLES, ALLOWED_GENDERS };