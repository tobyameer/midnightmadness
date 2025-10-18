export const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function submitManualPaymentTicket(payload: unknown) {
  const res = await fetch(`${API_BASE}/tickets/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Request failed (${res.status})`);
  }
  return res.json();
}
