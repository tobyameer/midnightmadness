const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("ℹ️ Copied server/.env.example to server/.env");
}

require("dotenv").config({ path: envPath });

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
const normalizeOrigin = (origin) => {
  if (typeof origin !== "string") return undefined;
  return origin.trim().replace(/\/+$/, "").toLowerCase();
};

const isProduction =
  (process.env.NODE_ENV || "").toLowerCase() === "production";
const envOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
].flatMap((value) =>
  String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
);

const localDevOrigins = isProduction
  ? []
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5202",
      "http://localhost:8080", // ✅ add this
    ];

const allowedOriginsList = [...envOrigins, ...localDevOrigins];

const allowedOriginsSet = new Set(
  allowedOriginsList.map((origin) => normalizeOrigin(origin)).filter(Boolean)
);

const isInternalRequest = (req) => {
  const ip = (req.ip || "").replace("::ffff:", "");
  return ip === "127.0.0.1" || ip === "::1";
};

const corsOptionsDelegate = (req, callback) => {
  const rawOrigin = req.headers.origin;
  const normalizedOrigin = normalizeOrigin(rawOrigin);

  if (!rawOrigin) {
    if (
      isInternalRequest(req) ||
      req.path.startsWith("/api/admin") ||
      adminAuth.hasAdminAccess?.(req) ||
      (req.method === "POST" && req.path === "/api/tickets/manual")
    ) {
      return callback(null, {
        origin: true,
        credentials: true,
      });
    }
    return callback(null, { origin: false });
  }

  if (allowedOriginsSet.has(normalizedOrigin)) {
    return callback(null, {
      origin: true,
      credentials: true,
    });
  }

  console.error("❌ Blocked origin:", rawOrigin);
  return callback(null, {
    origin: false,
  });
};

app.use(
  cors((req, callback) => {
    corsOptionsDelegate(req, (err, options) => {
      if (err) {
        return callback(err);
      }
      return callback(null, options);
    });
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Unexpected server error.", details: err.message });
});

async function connectToDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn(
      "⚠ MongoDB connection failed but server will continue running: MONGO_URI is not defined"
    );
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
    return true;
  } catch (error) {
    console.warn(
      `⚠ MongoDB connection failed but server will continue running: ${error.message}`
    );
    return false;
  }
}

async function startServer() {
  let port = Number(process.env.PORT) || 5000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const server = app
          .listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
            console.log(
              "✅ Production mode active — manual payments only — debug routes disabled."
            );
            resolve(server);
          })
          .on("error", reject);
      });
      break;
    } catch (error) {
      if (error.code === "EADDRINUSE") {
        const nextPort = port + 1;
        console.warn(`⚠ Port ${port} is busy, switching to ${nextPort}`);
        port = nextPort;
      } else {
        console.error("Failed to start server:", error);
        break;
      }
    }
  }
}

(async function bootstrap() {
  await connectToDatabase();
  await startServer();
})();
