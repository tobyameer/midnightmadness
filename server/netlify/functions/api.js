// server/netlify/functions/api.js
// CommonJS-only Netlify Function wrapper around your Express app

const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
// ⚠️ Remove helmet (ESM-only in v7+) to avoid "Unexpected token export"
// If you really want some security headers, add a tiny CJS middleware below.
const mongoose = require("mongoose");

const app = express();

// --- minimal headers instead of helmet (CJS-safe) ---
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  // Disable the deprecated X-XSS-Protection header in modern browsers
  res.setHeader("X-XSS-Protection", "0");
  next();
});

// Trust proxy / disable etag for functions
app.set("trust proxy", 1);
app.set("etag", false);

// Broad CORS for the function (you can tighten later)
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- Mongo connection cache (CJS safe) ----
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("⚠ MONGO_URI not defined");
    return null;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    cachedDb = mongoose.connection;
    console.log("✅ MongoDB connected");
    return cachedDb;
  } catch (err) {
    console.warn(`⚠ MongoDB connection failed: ${err.message}`);
    return null;
  }
}

// ---- Import ONLY CommonJS modules here ----
// Make sure these files use require/module.exports (NO `export`/`import`)
const ticketRoutes = require("../../routes/tickets");
const publicRoutes = require("../../routes/public");
const adminVerifyRoutes = require("../../routes/adminVerify");

// Debug
app.use((req, _res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// Health checks
app.get("/health", (_req, res) =>
  res.json({ status: "ok", message: "API is running" })
);
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", message: "API is running" })
);

// Mount routers under /api to match your redirects
app.use("/api", publicRoutes);
app.use("/api/admin", adminVerifyRoutes);
app.use("/api/tickets", ticketRoutes);

// 404
app.use((req, res) => {
  res
    .status(404)
    .json({ message: "Route not found.", path: req.path, method: req.method });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Unexpected server error.", details: err.message });
});

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  return handler(event, context);
};
