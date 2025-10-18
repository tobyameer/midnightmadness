export const API_BASE = "/api";

export async function registerTicket(payload: any) {
  const res = await fetch(`${API_BASE}/tickets/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Registration failed (${res.status})`);
  return res.json();
}

export async function submitManualPaymentTicket(payload: any) {
  const res = await fetch(`${API_BASE}/tickets/manual-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Manual payment registration failed (${res.status})`);
  return res.json();
}
