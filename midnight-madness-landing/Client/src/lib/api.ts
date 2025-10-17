import { API_BASE_URL } from "./config";

type FetchOptions = RequestInit;

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

export type ManualPaymentAttendee = {
  fullName: string;
  nationalId: string;
  gender: "male" | "female";
  email: string;
  phone: string;
};

export type ManualPaymentPayload = {
  packageType: "single" | "couple";
  contactEmail: string;
  paymentNote?: string;
  attendees: ManualPaymentAttendee[];
};

export function submitManualPaymentTicket(payload: ManualPaymentPayload) {
  return apiFetch<{ ticketId: string; status: string }>("/api/tickets/manual", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { API_BASE_URL };
