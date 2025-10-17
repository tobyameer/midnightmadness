import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_ADMIN_API_BASE_URL?.trim() || "http://localhost:5003";
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY?.trim();

const TOKEN_KEY = "admin_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...(config.headers || {}) };
  if (ADMIN_API_KEY) {
    headers["x-admin-api-key"] = ADMIN_API_KEY;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No admin token found. Login required for admin requests.");
  }
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export type PendingTicket = {
  _id?: string;
  ticketId?: string;
  fullName?: string;
  packageType?: "single" | "couple" | string;
  attendees?: Array<{ fullName?: string; nationalId?: string; gender?: string; email?: string; phone?: string }>;
  paymentNote?: string;
  contactEmail?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  payment?: {
    status?: string;
    method?: string;
  };
};

export type PaidTicket = PendingTicket & {
  payment?: {
    paidAt?: string;
    amountCents?: number;
  };
};

export async function login(apiKey: string) {
  const response = await api.post<{ token: string }>("/login", { apiKey });
  const { token } = response.data;
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export async function fetchPendingTickets() {
  const response = await api.get<{ tickets: PendingTicket[] }>("/tickets/pending");
  console.debug("Pending tickets response:", response.data);
  return response.data.tickets || [];
}

export async function fetchPaidTickets(search?: string) {
  const response = await api.get<{ tickets: PaidTicket[] }>("/tickets/paid", {
    params: search ? { search } : undefined,
  });
  return response.data.tickets || [];
}

export async function markTicketPaid(ticketId: string, note?: string) {
  const response = await api.post<{ message: string }>(
    `/tickets/${ticketId}/mark-paid`,
    note ? { note } : undefined,
  );
  return response.data;
}

export async function declineTicket(ticketId: string, reason?: string) {
  const response = await api.post<{ message: string }>(
    `/tickets/${ticketId}/decline`,
    reason ? { reason } : undefined,
  );
  return response.data;
}
