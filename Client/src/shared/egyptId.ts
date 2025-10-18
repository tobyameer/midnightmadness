export type EgyptianIdGender = "male" | "female" | "invalid";

export function getEgyptianIdGender(id: string): EgyptianIdGender {
  if (typeof id !== "string") return "invalid";
  const s = id.trim();
  if (!/^\d{14}$/.test(s)) return "invalid";
  const digit = Number(s[12]);
  if (Number.isNaN(digit)) return "invalid";
  return digit % 2 === 0 ? "female" : "male";
}
