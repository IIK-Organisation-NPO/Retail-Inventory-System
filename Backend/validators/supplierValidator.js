// Backend/validators/supplierValidator.js
// Validation rules for supplier profile updates + password changes.
// Returns { errors: { field: message }, cleaned }. Empty errors = valid.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// SA mobile: 10 digits starting with 0, OR +27 followed by 9 digits
const SA_MOBILE_RE = /^(?:0\d{9}|\+27\d{9})$/;
// Password: >=8 chars, upper + lower + digit + special
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

const trim = (v) => (typeof v === "string" ? v.trim() : "");

const splitFullName = (fullName) => {
  const cleaned = trim(fullName).replace(/\s+/g, " ");
  if (!cleaned) return { name: "", surname: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { name: parts[0], surname: "" };
  return {
    name: parts[0],
    surname: parts.slice(1).join(" "),
  };
};

// --- FULL PROFILE (used elsewhere, do not remove) ---
const validateSupplierProfile = (body) => {
  const errors = {};

  const companyName = trim(body.companyName);
  const contactPerson = trim(body.contactPerson);
  const email = trim(body.email).toLowerCase();
  const mobileRaw = trim(body.mobile).replace(/\s+/g, "");
  const mobile = mobileRaw.startsWith("+27")
    ? "0" + mobileRaw.substring(3)
    : mobileRaw;

  if (!companyName) {
    errors.companyName = "Company name is required.";
  } else if (companyName.length < 2) {
    errors.companyName = "Company name must be at least 2 characters.";
  } else if (companyName.length > 50) {
    errors.companyName = "Company name must be 50 characters or fewer.";
  } else if (/[<>]/.test(companyName)) {
    errors.companyName = "Company name cannot contain < or >.";
  }

  const { name, surname } = splitFullName(contactPerson);
  if (!contactPerson) {
    errors.contactPerson = "Contact person is required.";
  } else if (!name || !surname) {
    errors.contactPerson = "Enter first and last name.";
  } else if (name.length > 50 || surname.length > 25) {
    errors.contactPerson = "Name too long (max 50 for first, 25 for last).";
  } else if (/[<>]/.test(contactPerson)) {
    errors.contactPerson = "Name cannot contain < or >.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > 50) {
    errors.email = "Email must be 50 characters or fewer.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!mobile) {
    errors.mobile = "Mobile number is required.";
  } else if (mobile.length > 12) {
    errors.mobile = "Mobile number too long.";
  } else if (!SA_MOBILE_RE.test(mobile)) {
    errors.mobile =
      "Enter a valid SA mobile number (e.g. 0821234567 or +27821234567).";
  }

  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      errors.categories = "Choose at least one category.";
    } else if (body.categories.length > 20) {
      errors.categories = "Too many categories selected.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, cleaned: null };
  }

  return {
    errors: {},
    cleaned: {
      companyName,
      name,
      surname,
      email,
      mobile,
    },
  };
};

// --- EMAIL / MOBILE / COMPANY NAME (update path) ---
const validateSupplierProfileUpdate = (body) => {
  const errors = {};

  const companyName = trim(body.companyName);
  const emailRaw = trim(body.email);
  const email = emailRaw.toLowerCase();
  const mobileRaw = trim(body.mobile).replace(/\s+/g, "");
  const mobile = mobileRaw.startsWith("+27")
    ? "0" + mobileRaw.substring(3)
    : mobileRaw;

  if (!companyName) {
    errors.companyName = "Company name is required.";
  } else if (companyName.length < 2) {
    errors.companyName = "Company name must be at least 2 characters.";
  } else if (companyName.length > 50) {
    errors.companyName = "Company name must be 50 characters or fewer.";
  } else if (/[<>]/.test(companyName)) {
    errors.companyName = "Company name cannot contain < or >.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > 50) {
    errors.email = "Email must be 50 characters or fewer.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!mobile) {
    errors.mobile = "Mobile number is required.";
  } else if (mobile.length > 12) {
    errors.mobile = "Mobile number too long.";
  } else if (!SA_MOBILE_RE.test(mobile)) {
    errors.mobile =
      "Enter a valid SA mobile number (e.g. 0821234567 or +27821234567).";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, cleaned: null };
  }

  return { errors: {}, cleaned: { companyName, email, mobile } };
};

// --- CHANGE PASSWORD (Step 4B) ---
// Validates currentPassword + newPassword. Does NOT touch the DB.
const validateChangePassword = (body) => {
  const errors = {};

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!newPassword) {
    errors.newPassword = "New password is required.";
  } else if (!PASSWORD_RE.test(newPassword)) {
    errors.newPassword =
      "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
  } else if (newPassword === currentPassword) {
    errors.newPassword =
      "New password must be different from your current password.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, cleaned: null };
  }

  return { errors: {}, cleaned: { currentPassword, newPassword } };
};

// --- 4C: COMPANY PROFILE (categories / delivery areas / depots) ---
// Body: { categories: string[], deliveryAreas: string[], depots: object[] }
// All three are optional (partial updates). Missing key = leave column alone.
const validateCompanyProfileBody = (body) => {
  const errors = {};

  const has = (k) => body[k] !== undefined;

  // ---- categories ----
  let categories;
  if (has("categories")) {
    if (!Array.isArray(body.categories)) {
      errors.categories = "Categories must be an array.";
    } else if (body.categories.length > 50) {
      errors.categories = "Too many categories (max 50).";
    } else {
      categories = [];
      const seen = new Set();
      for (const raw of body.categories) {
        if (typeof raw !== "string") {
          errors.categories = "Each category must be a string.";
          break;
        }
        const name = raw.trim();
        if (!name) {
          errors.categories = "Category names cannot be empty.";
          break;
        }
        if (name.length > 100) {
          errors.categories = "Category names must be 100 chars or fewer.";
          break;
        }
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        categories.push(name);
      }
    }
  }

  // ---- deliveryAreas ----
  let deliveryAreas;
  if (has("deliveryAreas")) {
    if (!Array.isArray(body.deliveryAreas)) {
      errors.deliveryAreas = "Delivery areas must be an array.";
    } else if (body.deliveryAreas.length > 100) {
      errors.deliveryAreas = "Too many delivery areas (max 100).";
    } else {
      deliveryAreas = [];
      const seen = new Set();
      for (const raw of body.deliveryAreas) {
        if (typeof raw !== "string") {
          errors.deliveryAreas = "Each delivery area must be a string.";
          break;
        }
        const name = raw.trim();
        if (!name) {
          errors.deliveryAreas = "Delivery area names cannot be empty.";
          break;
        }
        if (name.length > 100) {
          errors.deliveryAreas =
            "Delivery area names must be 100 chars or fewer.";
          break;
        }
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deliveryAreas.push(name);
      }
    }
  }

  // ---- depots ----
  let depots;
  if (has("depots")) {
    if (!Array.isArray(body.depots)) {
      errors.depots = "Depots must be an array.";
    } else if (body.depots.length > 50) {
      errors.depots = "Too many depots (max 50).";
    } else {
      depots = [];
      const seen = new Set();
      for (const raw of body.depots) {
        if (!raw || typeof raw !== "object") {
          errors.depots = "Each depot must be an object.";
          break;
        }
        const name = trim(raw.name);
        if (!name) {
          errors.depots = "Depot name is required.";
          break;
        }
        if (name.length > 100) {
          errors.depots = "Depot name must be 100 chars or fewer.";
          break;
        }
        const key = name.toLowerCase();
        if (seen.has(key)) {
          errors.depots = `Duplicate depot name: "${name}".`;
          break;
        }
        seen.add(key);

        const address = trim(raw.address);
        const municipality = trim(raw.municipality);
        const contact = trim(raw.contact);

        if (address.length > 255) {
          errors.depots = "Depot address must be 255 chars or fewer.";
          break;
        }
        if (municipality.length > 100) {
          errors.depots = "Depot municipality must be 100 chars or fewer.";
          break;
        }
        if (contact.length > 50) {
          errors.depots = "Depot contact must be 50 chars or fewer.";
          break;
        }

        depots.push({
          id:
            typeof raw.id === "number" && Number.isFinite(raw.id)
              ? raw.id
              : undefined, // controller assigns one if missing
          name,
          address,
          municipality,
          contact,
        });
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, cleaned: null };
  }

  const cleaned = {};
  if (categories !== undefined) cleaned.categories = categories;
  if (deliveryAreas !== undefined) cleaned.deliveryAreas = deliveryAreas;
  if (depots !== undefined) cleaned.depots = depots;

  return { errors: {}, cleaned };
};

module.exports = {
  validateSupplierProfile,
  validateSupplierProfileUpdate,
  validateChangePassword,
  validateCompanyProfileBody,
};