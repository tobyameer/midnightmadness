const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { connectToDatabase, redact } = require("../../utils/db");

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

const sendHealth = (_req, res) => res.json({ status: "ok", message: "API is running" });
app.get("/health", sendHealth);
app.get("/api/health", sendHealth);

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

// Mount routers under /api
app.use("/api", publicRoutes);
app.use("/api/admin", adminVerifyRoutes);
app.use("/api/tickets", ticketRoutes);

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const uri = process.env.MONGO_URI || "";
  const scheme = uri.split("://")[0] || "";
  const alreadyConnected = mongoose.connection.readyState === 1;
  console.log("🔁 Netlify invocation", {
    mongoScheme: scheme || null,
    isSrv: uri.startsWith("mongodb+srv://"),
    connected: alreadyConnected,
    uri: redact(uri) || null,
  });
  await connectToDatabase();
  // Strip "/.netlify/functions/api" if present so routers see "/..."
  if (event.path) {
    event.path = event.path.replace(/^\/\.netlify\/functions\/api/, "/api");
  }
  return handler(event, context);
};
