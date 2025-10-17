const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

const app = express();

// Trust proxy
app.set("trust proxy", 1);
app.set("etag", false);

// Security
app.use(helmet());

// CORS - allow all origins for now
app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with caching
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("⚠ MONGO_URI not defined");
    return null;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = mongoose.connection;
    console.log("✅ MongoDB connected");
    return cachedDb;
  } catch (error) {
    console.warn(`⚠ MongoDB connection failed: ${error.message}`);
    return null;
  }
}

// Import routes
const ticketRoutes = require("../../routes/tickets");
const publicRoutes = require("../../routes/public");
const adminVerifyRoutes = require("../../routes/adminVerify");

// Debug middleware
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.path, req.url);
  next();
});

// Simple health check
app.get("/health", (_req, res) => {
  console.log("Health check hit");
  return res.json({ status: "ok", message: "API is running" });
});

app.get("/api/health", (_req, res) => {
  console.log("API Health check hit");
  return res.json({ status: "ok", message: "API is running" });
});

// Apply routes - mount at /api to match frontend calls
app.use("/api", publicRoutes);
app.use("/api/admin", adminVerifyRoutes);
app.use("/api/tickets", ticketRoutes);

// 404 handler
app.use((req, res) => {
  console.log("404 hit:", req.path, req.url);
  res.status(404).json({
    message: `Route not found.`,
    path: req.path,
    url: req.url,
    method: req.method,
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Unexpected server error.", details: err.message });
});

// Export handler
const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log("Function invoked:", event.path, event.httpMethod);

  // Connect to DB before handling request
  await connectToDatabase();

  return handler(event, context);
};
