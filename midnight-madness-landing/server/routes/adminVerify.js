const express = require("express");
const Ticket = require("../models/Ticket");
const { generateTicketQr, buildTicketQrPayload } = require("../utils/qr");
const { sendTicketEmail } = require("../utils/email");
const { sendEmail } = require("../utils/sendEmail");
const { buildRejectionEmail } = require("../utils/emailTemplates");
const { logInfo, logWarn, logError } = require("../utils/logger");
const { getVerifyTicketUrl, getTicketPageUrl } = require("../utils/ticketUrls");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.post("/confirm-payment", async (req, res) => {
  if (!adminAuth.hasAdminAccess(req)) {
    logWarn("Admin payment confirmation blocked due to invalid credentials", {
      providedApiKey: Boolean(req.header("x-admin-api-key")),
      providedBearer: Boolean((req.header("authorization") || "").trim()),
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { ticketId, note } = req.body || {};

  if (!ticketId || typeof ticketId !== "string") {
    return res.status(400).json({ message: "ticketId is required." });
  }

  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      logWarn("Admin payment confirmation attempted for missing ticket", { ticketId });
      return res.status(404).json({ message: "Ticket not found." });
    }

    if (ticket.status === "paid") {
      logInfo("Admin payment confirmation skipped; ticket already paid", { ticketId });
      return res.json({ message: "Already paid." });
    }

    const now = new Date();
    ticket.status = "paid";
    ticket.payment = {
      ...(ticket.payment || {}),
      updatedAt: now,
    };

    const verifyUrl = getVerifyTicketUrl(ticket.ticketId);
    if (verifyUrl) {
      ticket.qrCode = await generateTicketQr(
        buildTicketQrPayload(ticket, { verifyUrl }),
      );
    }

    ticket.paymentHistory = ticket.paymentHistory || [];
    ticket.paymentHistory.push({
      event: "admin_marked_paid",
      status: "paid",
      amountCents: undefined,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      note: note || undefined,
    });
    if (ticket.paymentHistory.length > 200) {
      ticket.paymentHistory = ticket.paymentHistory.slice(-200);
    }

    await ticket.save();

    const recipientEmails = Array.from(
      new Set(
        [
          ticket.contactEmail,
          ...(ticket.attendees || []).map((attendee) => attendee.email),
        ].filter(Boolean),
      ),
    );
    const primaryName = ticket.attendees?.[0]?.fullName || "Guest";

    try {
      await sendTicketEmail({
        to: recipientEmails,
        name: primaryName,
        ticketId: ticket.ticketId,
        qrCodeDataUrl: ticket.qrCode,
        paymentUrl: getTicketPageUrl(ticket.ticketId),
        packageType: ticket.packageType,
        attendees: ticket.attendees,
      });
      ticket.payment.emailSentAt = new Date();
      ticket.payment.updatedAt = new Date();
      ticket.payment.lastEmailError = undefined;
      await ticket.save();
      logInfo("Admin payment confirmation email sent", { ticketId });
    } catch (emailError) {
      ticket.payment.lastEmailError = emailError.message;
      ticket.payment.updatedAt = new Date();
      await ticket.save();
      logError("Admin payment confirmation email failed", {
        ticketId,
        error: emailError.message,
      });
    }

    logInfo("Admin payment manually confirmed", {
      ticketId,
    });
    if (ticket.packageType === "couple") {
      console.log("✔ Ticket marked paid - couple", ticket.ticketId);
    }
    return res.json({ message: "Marked paid and email sent." });
  } catch (error) {
    logError("Admin payment confirmation failed", {
      ticketId,
      error: error.message,
    });
    return res.status(500).json({ message: "Failed to confirm payment." });
  }
});

router.post("/decline-payment", async (req, res) => {
  if (!adminAuth.hasAdminAccess(req)) {
    logWarn("Admin decline blocked due to invalid credentials", {
      providedApiKey: Boolean(req.header("x-admin-api-key")),
      providedBearer: Boolean((req.header("authorization") || "").trim()),
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { ticketId, reason } = req.body || {};

  if (!ticketId || typeof ticketId !== "string") {
    return res.status(400).json({ message: "ticketId is required." });
  }

  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      logWarn("Admin decline attempted for missing ticket", { ticketId });
      return res.status(404).json({ message: "Ticket not found." });
    }

    ticket.status = "pending_manual_payment";
    ticket.paymentHistory = ticket.paymentHistory || [];
    ticket.paymentHistory.push({
      event: "admin_declined",
      status: "failed",
      note: reason || undefined,
      createdAt: new Date(),
    });
    if (ticket.paymentHistory.length > 100) {
      ticket.paymentHistory = ticket.paymentHistory.slice(-100);
    }

    await ticket.save();

    const declineRecipients = Array.from(
      new Set(
        [
          ticket.contactEmail,
          ...(ticket.attendees || []).map((attendee) => attendee.email),
        ].filter(Boolean),
      ),
    );
    const primaryName = ticket.attendees?.[0]?.fullName || "Guest";

    try {
      await Promise.all(
        declineRecipients.map((recipient) =>
          sendEmail({
            to: recipient,
            subject: "⛔ Midnight Madness Ticket Update",
            html: buildRejectionEmail({ name: primaryName }),
          }),
        ),
      );
      logInfo("Admin decline notification email sent", { ticketId });
    } catch (emailError) {
      logError("Admin decline email failed", { ticketId, error: emailError.message });
    }

    logInfo("Admin payment manually declined", { ticketId, reason });
    return res.json({ message: "Payment declined." });
  } catch (error) {
    logError("Admin decline failed", { ticketId, error: error.message });
    return res.status(500).json({ message: "Failed to decline payment." });
  }
});

module.exports = router;

// Test:
// curl -X POST http://localhost:5001/api/admin/confirm-payment \
//   -H "Content-Type: application/json" \
//   -H "x-admin-api-key: super-secret-admin-token" \
//   -d '{"ticketId":"MM-TEST-123","provider":"vodafone","providerRef":"TX-123"}'
