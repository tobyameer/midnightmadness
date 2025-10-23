const sanitizeBase = (url) => {
  if (!url) return "";
  return String(url).trim().replace(/\/+$/, "");
};

const firstFromCsv = (value) =>
  (value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0] || "";

const getBackendBase = () => {
  const fallbackPort = Number(process.env.PORT) || 5001;
  const fallback = `http://localhost:${fallbackPort}`;
  const base =
    process.env.BACKEND_VERIFY_BASE_URL ||
    process.env.BACKEND_BASE_URL ||
    process.env.API_BASE_URL ||
    fallback;
  return sanitizeBase(base);
};

const getFrontendBase = () => {
  const base =
    process.env.BASE_FRONTEND_URL || firstFromCsv(process.env.CLIENT_URL || "");
  return sanitizeBase(base);
};

const getVerifyTicketUrl = (ticketId) => {
  const base = getBackendBase();
  if (!base || !ticketId) return "";
  return `${base}/api/verify-ticket/${encodeURIComponent(ticketId)}`;
};

const getPaymentStatusUrl = () => {
  return "";
};

const getTicketPageUrl = () => {
  const base = getFrontendBase();
  return base;
};

module.exports = {
  getVerifyTicketUrl,
  getPaymentStatusUrl,
  getTicketPageUrl,
  getBackendBase,
  getFrontendBase,
};
