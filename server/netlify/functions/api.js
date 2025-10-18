const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

// Routers (CommonJS)
const publicRoutes = require("../../routes/public");
const adminVerifyRoutes = require("../../routes/adminVerify");
const ticketRoutes = require("../../routes/tickets");

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cache
let cachedDb = null;

function redactMongoUri(uri) {
  if (!uri) return "";
  // strip credentials safely
  return uri.replace(/\/\/([^@]+)@/, "//<redacted>@");
}

async function connectToDatabase() {
  // Use cached live connection when possible
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("⚠ MONGO_URI is not set. Skipping DB connection.");
    return null;
  }

  if (!uri.startsWith("mongodb+srv://")) {
    console.warn(
      "⚠ MONGO_URI does not use SRV scheme. Use your Atlas SRV URL (mongodb+srv://...). Current:",
      redactMongoUri(uri)
    );
  }

  try {
    await mongoose.connect(uri, {
      // Keep options minimal for Atlas SRV; it configures TLS automatically.
      serverSelectionTimeoutMS: 12000,
    });
    cachedDb = mongoose.connection;
    console.log("✅ MongoDB connected:", {
      hosts: mongoose.connection.host,
      name: mongoose.connection.name,
    });
    return cachedDb;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", {
      message: err.message,
      name: err.name,
      code: err.code,
    });
    throw err; // propagate so Netlify logs show the real cause
  }
}

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", message: "API is running" }));

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
  const state = stateMap[mongoose.connection.readyState] || "unknown";

  res.json({
    ok: true,
    mongo: {
      scheme,
      isSrv,
      connected: mongoose.connection.readyState === 1,
      state,
      // redact creds, show only host/db meta if available
      host: mongoose.connection.host || null,
      db: mongoose.connection.name || null,
      uriRedacted: redactMongoUri(uri),
    },
  });
});

// Mount routers under /api
app.use("/", publicRoutes);
app.use("/admin", adminVerifyRoutes);
app.use("/tickets", ticketRoutes);

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const uri = process.env.MONGO_URI || "";
  const scheme = uri.split("://")[0] || "";
  const alreadyConnected = mongoose.connection.readyState === 1;
  console.log("🔁 Netlify invocation", {
    mongoScheme: scheme || null,
    connected: alreadyConnected,
    uri: redactMongoUri(uri) || null,
  });
  await connectToDatabase();
  // Strip "/.netlify/functions/api" if present so routers see "/..."
  if (event.path && event.path.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "");
  }
  return handler(event, context);
};
