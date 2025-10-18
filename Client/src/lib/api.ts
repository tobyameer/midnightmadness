const ENV_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

/**
 * Default base:
 * - In production builds (Netlify), prefer relative "/api"
 * - In local dev, if you're running a local server, set VITE_API_BASE_URL
 *   in .env.local (e.g., http://localhost:5003/api). Otherwise fallback to "/api".
 */
const DEFAULT_BASE =
  (typeof window !== "undefined" && (import.meta.env.DEV === true))
    ? (ENV_BASE || "/api")
    : "/api";

export const API_BASE = (ENV_BASE || DEFAULT_BASE).replace(/\/$/, "");

// Example helper
export async function postManualPayment(payload: {
  fullName: string;
  phone: string;
  nationalId: string;
  email: string;
}) {
  const res = await fetch(`${API_BASE}/tickets/manual-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Manual payment failed (${res.status}): ${text || "unknown error"}`);
  }
  return res.json();
}

// Alias for compatibility with existing code
export const submitManualPaymentTicket = postManualPayment;