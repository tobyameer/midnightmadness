const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { connectToDatabase, redact } = require("../../utils/db");

// Import routes - make sure these paths are correct!
const adminRoutes = require("../../routes/adminVerify"); // Has login, verify, logout
const ticketRoutes = require("../../routes/tickets"); // Has ticket endpoints
// Note: payments route not needed yet

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
const sendHealth = (_req, res) =>
  res.json({ status: "ok", message: "API is running" });
app.get("/health", sendHealth);
app.get("/api/health", sendHealth);

// MongoDB diagnostics
app.get("/api/diag/mongo", async (_req, res) => {
  const uri = process.env.MONGO_URI || "";
  const scheme = uri.split("://")[0] || "";
  const isSrv = scheme === "mongodb+srv";
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };
  let lastError = null;

  try {
    await connectToDatabase();
  } catch (err) {
    lastError = err;
  }

  const state = stateMap[mongoose.connection.readyState] || "unknown";

  res.status(lastError ? 500 : 200).json({
    ok: !lastError,
    mongo: {
      scheme,
      isSrv,
      connected: mongoose.connection.readyState === 1,
      state,
      host: mongoose.connection.host || null,
      db: mongoose.connection.name || null,
      uriRedacted: redact(uri),
    },
    error: lastError
      ? {
          message: lastError.message,
          name: lastError.name,
          code: lastError.code,
        }
      : undefined,
  });
});

// Mount routes
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);

// Catch-all 404
app.use((req, res) => {
  console.log("❌ 404:", req.method, req.path);
  res.status(404).json({
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const uri = process.env.MONGO_URI || "";
  const scheme = uri.split("://")[0] || "";
  const alreadyConnected = mongoose.connection.readyState === 1;

  console.log("🔁 Netlify invocation", {
    path: event.path,
    method: event.httpMethod,
    mongoScheme: scheme || null,
    connected: alreadyConnected,
    uri: redact(uri) || null,
    hasAdminKey: !!process.env.ADMIN_API_KEY,
    hasJwtSecret: !!(process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET),
  });

  await connectToDatabase();

  // Strip "/.netlify/functions/api" if present so routers see "/..."
  if (event.path && event.path.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "");
  }

  return handler(event, context);
};
