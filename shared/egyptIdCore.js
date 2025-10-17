// Pure CommonJS version for backend
const GOVERNORATE_CODES = {
  "01": "Cairo",
  "02": "Alexandria",
  "03": "Port Said",
  "04": "Suez",
  11: "Damietta",
  12: "Dakahlia",
  13: "Sharqia",
  14: "Kalyoubia",
  15: "Kafr El Sheikh",
  16: "Gharbia",
  17: "Monufia",
  18: "Beheira",
  19: "Ismailia",
  21: "Giza",
  22: "Beni Suef",
  23: "Fayoum",
  24: "Minya",
  25: "Assiut",
  26: "Sohag",
  27: "Qena",
  28: "Aswan",
  29: "Luxor",
  31: "Red Sea",
  32: "New Valley",
  33: "Matrouh",
  34: "North Sinai",
  35: "South Sinai",
  88: "Foreign",
};

function computeLuhnCheckDigit(payload) {
  let sum = 0;
  const reversed = payload.split("").reverse();
  reversed.forEach((char, index) => {
    let digit = Number(char);
    if (Number.isNaN(digit)) {
      digit = 0;
    }
    if (index % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  });
  return (10 - (sum % 10)) % 10;
}

function validateEgyptianId(nid, options = {}) {
  const settings = {
    useLuhn: Boolean(options.useLuhn),
  };

  const raw = String(nid || "").trim();
  const result = {
    valid: true,
    errors: [],
  };

  if (!raw) {
    result.valid = false;
    result.errors.push("National ID is required.");
    return result;
  }

  if (!/^\d+$/.test(raw)) {
    result.valid = false;
    result.errors.push("National ID must contain digits only.");
  }

  if (raw.length !== 14) {
    result.valid = false;
    result.errors.push("National ID must be exactly 14 digits.");
  }

  if (!result.valid) {
    return result;
  }

  const centuryDigit = Number(raw[0]);
  if (![2, 3].includes(centuryDigit)) {
    result.valid = false;
    result.errors.push("Century indicator must be 2 or 3.");
  }

  const yearPart = Number(raw.slice(1, 3));
  const monthPart = Number(raw.slice(3, 5));
  const dayPart = Number(raw.slice(5, 7));

  const centuryBase = centuryDigit === 2 ? 1900 : 2000;
  const fullYear = centuryBase + yearPart;
  const birthDate = new Date(fullYear, monthPart - 1, dayPart);

  if (
    Number.isNaN(yearPart) ||
    Number.isNaN(monthPart) ||
    Number.isNaN(dayPart) ||
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() + 1 !== monthPart ||
    birthDate.getDate() !== dayPart
  ) {
    result.valid = false;
    result.errors.push("Birth date encoded in National ID is invalid.");
  } else {
    const today = new Date();
    if (birthDate > today) {
      result.valid = false;
      result.errors.push("Birth date cannot be in the future.");
    } else {
      result.birthDate = birthDate.toISOString().slice(0, 10);
    }
  }

  const governorateCode = raw.slice(7, 9);
  const governorate = GOVERNORATE_CODES[governorateCode];

  if (!governorate) {
    result.valid = false;
    result.errors.push("Governorate code in National ID is not recognised.");
  } else {
    result.governorate = governorate;
  }

  const genderDigit = Number(raw[12]);
  if (!Number.isNaN(genderDigit)) {
    result.gender = genderDigit % 2 === 0 ? "female" : "male";
  }

  if (settings.useLuhn) {
    const expectedCheckDigit = computeLuhnCheckDigit(raw.slice(0, 13));
    const actualCheckDigit = Number(raw[13]);
    if (expectedCheckDigit !== actualCheckDigit) {
      result.valid = false;
      result.errors.push(
        "Check digit does not match (Luhn heuristic – unofficial validation)."
      );
    }
  }

  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}

function getEgyptianIdGender(id) {
  const raw = String(id || "").trim();
  if (!/^\d{14}$/.test(raw)) {
    return "invalid";
  }
  const genderDigit = Number(raw[12]);
  if (Number.isNaN(genderDigit)) {
    return "invalid";
  }
  return genderDigit % 2 === 0 ? "female" : "male";
}

module.exports = {
  GOVERNORATE_CODES,
  validateEgyptianId,
  getEgyptianIdGender,
};
