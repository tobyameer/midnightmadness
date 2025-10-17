// server/utils/egyptId.js
// CommonJS helpers for Egyptian National ID validation + gender detection

function getEgyptianIdGender(id) {
  if (typeof id !== "string") return "invalid";
  const s = id.trim();
  if (!/^\d{14}$/.test(s)) return "invalid";
  // 13th digit (index 12): odd = male, even = female
  const digit = Number(s[12]);
  if (Number.isNaN(digit)) return "invalid";
  return digit % 2 === 0 ? "female" : "male";
}

function validateEgyptianId(id) {
  const errors = [];
  if (typeof id !== "string") {
    return { valid: false, errors: ["ID must be a string"] };
  }

  const s = id.trim();
  if (!/^\d{14}$/.test(s)) {
    return { valid: false, errors: ["National ID must be exactly 14 digits."] };
  }

  const century = Number(s[0]); // 2 = 1900s, 3 = 2000s
  if (century !== 2 && century !== 3) {
    errors.push("Invalid century digit.");
  }

  const year = Number(s.slice(1, 3));
  const month = Number(s.slice(3, 5));
  const day = Number(s.slice(5, 7));
  const fullYear = (century === 2 ? 1900 : 2000) + year;

  const dt = new Date(fullYear, month - 1, day);
  const validDate =
    dt.getFullYear() === fullYear &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day;

  if (!validDate) {
    errors.push("Invalid birth date in national ID.");
  }

  const gender = getEgyptianIdGender(s);
  if (gender === "invalid") {
    errors.push("Could not detect gender from national ID.");
  }

  return {
    valid: errors.length === 0,
    errors,
    gender: gender === "invalid" ? undefined : gender,
    birthDate: validDate ? dt.toISOString().slice(0, 10) : undefined,
  };
}

module.exports = { validateEgyptianId, getEgyptianIdGender };
