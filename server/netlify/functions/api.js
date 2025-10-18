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

// Cache Mongo connection between invocations
let mongoReady = false;
async function connectOnce() {
  if (mongoReady) return;
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI not set; API will still respond to /health.");
    return;
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  mongoReady = true;
  console.log("✅ MongoDB connected (Netlify function)");
}

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", message: "API is running" }));

// Mount routers under /api
app.use("/", publicRoutes);
app.use("/admin", adminVerifyRoutes);
app.use("/tickets", ticketRoutes);

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectOnce();
  // Strip "/.netlify/functions/api" if present so routers see "/..."
  if (event.path && event.path.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "");
  }
  return handler(event, context);
};
