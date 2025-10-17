// netlify/functions/api.js
const serverlessHttp = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

// IMPORTANT: all your route files must also use CommonJS (module.exports / require)
const ticketRoutes = require("../../routes/tickets");
const publicRoutes = require("../../routes/public");
const adminVerifyRoutes = require("../../routes/adminVerify");

const app = express();

// Basic hardening
app.set("trust proxy", 1);
app.set("etag", false);
app.use(helmet());

// CORS (relax for now; tighten later)
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Mongo connection with reuse across invocations ---
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

// Debug
app.use((req, _res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Your API (we keep `/api` here; Netlify redirect will map /api/* → this function)
app.use("/api", publicRoutes);
app.use("/api/admin", adminVerifyRoutes);
app.use("/api/tickets", ticketRoutes);

// 404
app.use((req, res) => {
  res
    .status(404)
    .json({ message: "Route not found.", path: req.path, url: req.url });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Unexpected server error.", details: err.message });
});

// Build serverless handler (rename to avoid confusion)
const appHandler = serverlessHttp(app);

// Export handler for Netlify (CommonJS)
module.exports.handler = async (event, context) => {
  // Re-use DB connection between warm invocations
  context.callbackWaitsForEmptyEventLoop = false;

  await connectToDatabase();
  return appHandler(event, context);
};
