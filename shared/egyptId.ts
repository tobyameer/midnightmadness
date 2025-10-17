import { validateEgyptianId as validateEgyptianIdCore } from "./egyptIdCore.js";

export type EgyptianIdValidationOptions = {
  useLuhn?: boolean;
};

export type EgyptianIdValidationResult = {
  valid: boolean;
  errors: string[];
  birthDate?: string;
  governorate?: string;
  gender?: "male" | "female";
};

const validateEgyptianIdImpl: (
  nid: string,
  options?: EgyptianIdValidationOptions
) => EgyptianIdValidationResult = validateEgyptianIdCore;

/**
 * Validates an Egyptian national ID string.
 * @param nid National ID value to validate.
 * @param options Optional validation flags.
 */
export function validateEgyptianId(
  nid: string,
  options: EgyptianIdValidationOptions = {}
): EgyptianIdValidationResult {
  return validateEgyptianIdImpl(nid, options);
}

export function getEgyptianIdGender(id: string): "male" | "female" | "invalid" {
  const sanitized = String(id || "").trim();
  if (!/^\d{14}$/.test(sanitized)) {
    return "invalid";
  }

  const genderDigit = Number.parseInt(sanitized[12], 10);
  if (Number.isNaN(genderDigit)) {
    return "invalid";
  }

  return genderDigit % 2 === 0 ? "female" : "male";
}

export type { EgyptianIdValidationResult as ValidateEgyptianIdResponse };
