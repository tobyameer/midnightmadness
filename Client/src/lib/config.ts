const DEFAULT_SESSION_TIMEOUT_MIN = 15;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

export const SESSION_TIMEOUT_MIN = Number(
  import.meta.env.VITE_SESSION_TIMEOUT_MIN ?? DEFAULT_SESSION_TIMEOUT_MIN
);

export const ENVIRONMENT_LABEL = import.meta.env.VITE_ENVIRONMENT_LABEL || "development";

export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com";