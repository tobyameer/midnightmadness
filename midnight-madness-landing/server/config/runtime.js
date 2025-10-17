const { getPriceSummary } = require('./pricing');

function toNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

const DEFAULT_SESSION_TIMEOUT_MIN = 15;
const DEFAULT_RESEND_LIMIT = 5;
const DEFAULT_WEBHOOK_RATE = 60;

function getSessionTimeoutMinutes() {
  const configured = toNumber(process.env.SESSION_TIMEOUT_MIN, DEFAULT_SESSION_TIMEOUT_MIN);
  return Math.max(5, configured);
}

function getSessionTimeoutMs() {
  return getSessionTimeoutMinutes() * 60 * 1000;
}

function getWebhookRateLimit() {
  return toNumber(process.env.RATE_LIMIT_WEBHOOK, DEFAULT_WEBHOOK_RATE);
}

function getResendLimit() {
  return toNumber(process.env.RATE_LIMIT_RESEND, DEFAULT_RESEND_LIMIT);
}

function buildClientRuntimeConfig() {
  const pricing = getPriceSummary();
  return {
    price: pricing.egp,
    priceEgp: pricing.egp,
    currency: pricing.currency,
    sessionTimeoutMinutes: getSessionTimeoutMinutes(),
    environment: (process.env.NODE_ENV || 'development').toLowerCase(),
    version: pricing.version || '1.0',
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getSessionTimeoutMinutes,
  getSessionTimeoutMs,
  getWebhookRateLimit,
  getResendLimit,
  buildClientRuntimeConfig,
};
