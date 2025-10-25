const PRICE_VERSION = "1.0";
const DEFAULT_PRODUCTION_PRICE_EGP = 650;
const DEFAULT_PRODUCTION_COUPLE_PRICE_EGP = 1300;
const DEFAULT_TEST_PRICE_EGP = 5;
const DEFAULT_TEST_COUPLE_PRICE_EGP = 10;

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function sanitizePrice(rawValue, fallback) {
  const parsed = toNumber(rawValue);
  if (parsed === null || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

const environment = (process.env.NODE_ENV || "development").toLowerCase();
const productionPriceEgp = sanitizePrice(
  process.env.PRICE_EGP,
  DEFAULT_PRODUCTION_PRICE_EGP
);
const productionCouplePriceEgp = sanitizePrice(
  process.env.COUPLE_PRICE_EGP,
  DEFAULT_PRODUCTION_COUPLE_PRICE_EGP
);
const configuredTestPrice = sanitizePrice(
  process.env.PRICE_TEST_EGP,
  DEFAULT_TEST_PRICE_EGP
);
const configuredTestCouplePrice = sanitizePrice(
  process.env.COUPLE_PRICE_TEST_EGP,
  DEFAULT_TEST_COUPLE_PRICE_EGP
);
const forceTestPricing =
  String(process.env.PRICE_FORCE_TEST || "").toLowerCase() === "true";

function getTestPriceEgp() {
  return configuredTestPrice ?? DEFAULT_TEST_PRICE_EGP;
}

function getTestCouplePriceEgp() {
  return configuredTestCouplePrice ?? DEFAULT_TEST_COUPLE_PRICE_EGP;
}

function getCurrentPriceEGP() {
  if (environment !== "production") {
    return getTestPriceEgp();
  }
  if (forceTestPricing) {
    return getTestPriceEgp();
  }
  return productionPriceEgp;
}

function getCurrentCouplePriceEGP() {
  if (environment !== "production") {
    return getTestCouplePriceEgp();
  }
  if (forceTestPricing) {
    return getTestCouplePriceEgp();
  }
  return productionCouplePriceEgp;
}

function priceToCents(value) {
  return Math.round(Number(value) * 100);
}

function getPriceSummary() {
  const egp = getCurrentPriceEGP();
  return {
    egp,
    cents: priceToCents(egp),
    currency: "EGP",
    version: PRICE_VERSION,
  };
}

function getCouplePriceSummary() {
  const egp = getCurrentCouplePriceEGP();
  return {
    egp,
    cents: priceToCents(egp),
    currency: "EGP",
    version: PRICE_VERSION,
  };
}

function buildPublicPricingSnapshot() {
  const singleSummary = getPriceSummary();
  const coupleSummary = getCouplePriceSummary();
  return {
    single: {
      price: singleSummary.egp,
      currency: singleSummary.currency,
    },
    couple: {
      price: coupleSummary.egp,
      currency: coupleSummary.currency,
    },
    env: environment || "development",
    version: PRICE_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

// Backwards compatibility for existing imports.
function getPrice() {
  return getPriceSummary();
}

if (
  environment !== "production" &&
  getTestPriceEgp() === DEFAULT_TEST_PRICE_EGP
) {
  const computed = getCurrentPriceEGP();
  if (computed !== DEFAULT_TEST_PRICE_EGP) {
    console.warn(
      "⚠️ Pricing assertion failed: expected 5 EGP in non-production with PRICE_TEST_EGP=5, got",
      computed
    );
  }
}

module.exports = {
  PRICE_VERSION,
  DEFAULT_PRODUCTION_PRICE_EGP,
  DEFAULT_PRODUCTION_COUPLE_PRICE_EGP,
  DEFAULT_TEST_PRICE_EGP,
  DEFAULT_TEST_COUPLE_PRICE_EGP,
  getCurrentPriceEGP,
  getCurrentCouplePriceEGP,
  getPriceSummary,
  getCouplePriceSummary,
  getPrice,
  priceToCents,
  buildPublicPricingSnapshot,
};
