// server/netlify/functions/api.js
const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { connectToDatabase, redact } = require("../../utils/db");

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: "*",
  credentials: true 
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running", timestamp: new Date().toISOString() });
});

// MongoDB diagnostics
app.get("/api/diag/mongo", async (req, res) => {
  const uri = process.env.MONGO_URI || "";
  const scheme = uri.split("://")[0] || "";
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

// Import routes - dynamically load to handle missing files gracefully
let publicRoutes, adminRoutes, ticketRoutes;

try {
  publicRoutes = require("../../routes/public");
} catch (err) {
  console.warn("⚠️ Public routes not found, creating minimal version");
  const express = require("express");
  publicRoutes = express.Router();
  publicRoutes.get("/health", (req, res) => res.json({ ok: true }));
}

try {
  adminRoutes = require("../../routes/adminVerify");
} catch (err) {
  console.warn("⚠️ Admin routes not found, creating minimal version");
  const express = require("express");
  const jwt = require("jsonwebtoken");
  adminRoutes = express.Router();
  
  // Minimal login endpoint
  adminRoutes.post("/login", (req, res) => {
    const { apiKey } = req.body;
    const expectedKey = process.env.ADMIN_API_KEY || "";
    
    if (!apiKey || apiKey !== expectedKey) {
      return res.status(401).json({ message: "Invalid API key" });
    }
    
    const token = jwt.sign(
      { admin: true },
      process.env.ADMIN_JWT_SECRET || process.env.ADMIN_API_KEY || "default-secret",
      { expiresIn: "24h" }
    );
    
    res.json({ success: true, token });
  });
}

try {
  ticketRoutes = require("../../routes/tickets");
} catch (err) {
  console.error("❌ Ticket routes not found:", err.message);
  const express = require("express");
  const Ticket = require("../../models/Ticket");
  const { generateTicketId } = require("../../utils/id");
  const { validateEgyptianId } = require("../../utils/egyptId");
  const QRCode = require("qrcode");
  const { sendEmail } = require("../../utils/email");
  
  ticketRoutes = express.Router();
  
  // Manual registration endpoint
  ticketRoutes.post("/manual", async (req, res) => {
    try {
      const { fullName, phone, nationalId, email } = req.body;

      // Validate required fields
      if (!fullName || !phone || !nationalId || !email) {
        return res.status(400).json({ 
          message: "Missing required fields",
          required: ["fullName", "phone", "nationalId", "email"]
        });
      }

      // Validate Egyptian National ID
      if (!validateEgyptianId(nationalId)) {
        return res.status(400).json({ message: "Invalid Egyptian National ID" });
      }

      // Check for existing ticket
      const existingTicket = await Ticket.findOne({ 
        $or: [{ nationalId }, { email }] 
      });
      
      if (existingTicket) {
        return res.status(409).json({ 
          message: "A ticket already exists with this National ID or email" 
        });
      }

      // Generate ticket ID
      const ticketId = generateTicketId();

      // Create ticket
      const ticket = new Ticket({
        ticketId,
        fullName,
        phone,
        nationalId,
        email,
        status: "pending_manual_payment",
        paymentMethod: "manual",
        createdAt: new Date(),
      });

      await ticket.save();

      // Generate QR code
      const qrPayload = JSON.stringify({ ticketId, email, fullName });
      const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

      // Send email (optional - may fail but shouldn't block registration)
      try {
        await sendEmail({
          to: email,
          subject: "Your Ticket - Pending Payment",
          html: `
            <h1>Registration Received!</h1>
            <p>Hi ${fullName},</p>
            <p>Your ticket ID is: <strong>${ticketId}</strong></p>
            <p>Status: Pending manual payment verification</p>
            <p>Please complete your payment and wait for confirmation.</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" />
          `,
        });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }

      res.status(201).json({
        success: true,
        message: "Ticket registered successfully",
        ticket: {
          ticketId,
          fullName,
          email,
          status: "pending_manual_payment",
        },
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      console.error("Manual registration error:", error);
      res.status(500).json({ 
        message: "Failed to register ticket",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // Verify ticket endpoint
  ticketRoutes.post("/verify", async (req, res) => {
    try {
      const { ticketId } = req.body;
      
      if (!ticketId) {
        return res.status(400).json({ message: "Ticket ID is required" });
      }

      const ticket = await Ticket.findOne({ ticketId });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json({
        success: true,
        ticket: {
          ticketId: ticket.ticketId,
          fullName: ticket.fullName,
          status: ticket.status,
          checkedIn: ticket.checkedIn,
          checkedInAt: ticket.checkedInAt,
        },
      });
    } catch (error) {
      console.error("Verify ticket error:", error);
      res.status(500).json({ message: "Failed to verify ticket" });
    }
  });

  // Get tickets by status (for public/admin)
  ticketRoutes.get("/pending", async (req, res) => {
    try {
      const tickets = await Ticket.find({ status: "pending_manual_payment" })
        .sort({ createdAt: -1 });
      res.json({ success: true, tickets });
    } catch (error) {
      console.error("Get pending tickets error:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  ticketRoutes.get("/paid", async (req, res) => {
    try {
      const tickets = await Ticket.find({ status: "confirmed" })
        .sort({ createdAt: -1 });
      res.json({ success: true, tickets });
    } catch (error) {
      console.error("Get paid tickets error:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Admin: Mark as paid
  ticketRoutes.post("/:ticketId/mark-paid", async (req, res) => {
    try {
      const { ticketId } = req.params;
      
      const ticket = await Ticket.findOneAndUpdate(
        { ticketId },
        { status: "confirmed" },
        { new: true }
      );

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json({ success: true, ticket });
    } catch (error) {
      console.error("Mark paid error:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Admin: Get all tickets with auth middleware
  const authMiddleware = require("../../middleware/auth");
  ticketRoutes.get("/", authMiddleware, async (req, res) => {
    try {
      const { status, search } = req.query;
      const query = {};

      if (status) {
        query.status = status === "pending" ? "pending_manual_payment" : status;
      }

      if (search) {
        query.$or = [
          { ticketId: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const tickets = await Ticket.find(query).sort({ createdAt: -1 });
      res.json({ success: true, tickets, count: tickets.length });
    } catch (error) {
      console.error("Get all tickets error:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });
}

// Mount routes
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);

// Log all registered routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`📍 Route: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(`📍 Route: ${Object.keys(handler.route.methods)} ${handler.route.path}`);
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log("❌ 404:", req.method, req.path);
  res.status(404).json({ 
    message: "Route not found",
    path: req.path,
    method: req.method,
    hint: "Available routes: /api/health, /api/tickets/manual, /api/admin/login"
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
    hasAdminKey: !!process.env.ADMIN_API_KEY,
    hasJwtSecret: !!(process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET)
  });
  
  await connectToDatabase();
  
  // Strip "/.netlify/functions/api" prefix for cleaner routing
  if (event.path && event.path.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "");
  }
  
  return handler(event, context);
};