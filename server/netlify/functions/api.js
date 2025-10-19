const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { connectToDatabase, redact } = require("../../utils/db");

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Import routes
const adminRoutes = require("../../routes/adminVerify");
const ticketRoutes = require("../../routes/tickets");
const publicRoutes = require("../../routes/public");

// Mount routes
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);

// 404 handler
app.use((req, res) => {
  console.log("❌ 404:", req.method, req.path);
  res.status(404).json({ message: "Route not found", path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log("🔁 Netlify invocation", {
    path: event.path,
    method: event.httpMethod,
  });
  
  await connectToDatabase();
  
  if (event.path && event.path.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "");
  }
  
  return handler(event, context);
};
