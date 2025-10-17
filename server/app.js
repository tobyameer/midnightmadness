// server/app.js
require("dotenv").config(); // harmless on Netlify (reads env from UI if no file)

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

const ticketRoutes = require("./routes/tickets");
const publicRoutes = require("./routes/public");
const adminVerifyRoutes = require("./routes/adminVerify");
const adminAuth = require("./middleware/adminAuth");

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);

app.use(helmet());

// === CORS (reuse your logic) ===
const normalizeOrigin = (origin) =>
  typeof origin === "string"
    ? origin.trim().replace(/\/+$/, "").toLowerCase()
    : undefined;

const isProduction =
  (process.env.NODE_ENV || "").toLowerCase() === "production";
const envOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
].flatMap((v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

const localDevOrigins = isProduction
  ? []
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5202",
      "http://localhost:8080",
    ];

const allowedOriginsSet = new Set(
  [...envOrigins, ...localDevOrigins].map(normalizeOrigin).filter(Boolean)
);

const isInternalRequest = (req) => {
  const ip = (req.ip || "").replace("::ffff:", "");
  return ip === "127.0.0.1" || ip === "::1";
};

const corsOptionsDelegate = (req, cb) => {
  const rawOrigin = req.headers.origin;
  const normalized = normalizeOrigin(rawOrigin);

  if (!rawOrigin) {
    if (
      isInternalRequest(req) ||
      req.path.startsWith("/api/admin") ||
      adminAuth?.hasAdminAccess?.(req) ||
      (req.method === "POST" && req.path === "/api/tickets/manual")
    ) {
      return cb(null, { origin: true, credentials: true });
    }
    return cb(null, { origin: false });
  }

  if (allowedOriginsSet.has(normalized)) {
    return cb(null, { origin: true, credentials: true });
  }
  console.error("❌ Blocked origin:", rawOrigin);
  return cb(null, { origin: false });
};

app.use((req, callback) => cors(corsOptionsDelegate)(req, callback));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// === Routes ===
app.use(publicRoutes);

app.use("/api/admin", (req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  res.set("Last-Modified", new Date().toUTCString());
  res.removeHeader("ETag");
  next();
});
app.use("/api/admin", adminVerifyRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/tickets", ticketRoutes);

// 404 + error handler
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
);
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Unexpected server error.", details: err.message });
});

// === MongoDB (connect once per cold start) ===
const { MONGO_URI } = process.env;
if (MONGO_URI && mongoose.connection.readyState === 0) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((e) => console.warn("⚠ MongoDB connection failed:", e.message));
}

module.exports = app;
