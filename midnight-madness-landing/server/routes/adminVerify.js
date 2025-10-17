const express = require("express");
const router = express.Router();

const Ticket = require("../models/Ticket");
const { generateTicketQr, buildTicketQrPayload } = require("../utils/qr");
const { sendEmail } = require("../utils/sendEmail");
const { logInfo, logWarn, logError } = require("../utils/logger");
const { getVerifyTicketUrl, getTicketPageUrl } = require("../utils/ticketUrls");
const adminAuth = require("../middleware/adminAuth");
const QRCode = require("qrcode");

/* ---------------------- Local email templates ---------------------- */
function renderPaymentConfirmationEmail({
  name,
  ticketId,
  paymentUrl,
  packageType,
  attendees,
}) {
  const attendeeSection = Array.isArray(attendees)
    ? attendees
        .map(
          (attendee) => `
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#ffffff;">
                  <strong style="color:#ffffff;">${
                    attendee.fullName || "Guest"
                  }</strong><br/>
                  <span style="color:#ffffff;">Email:</span> ${
                    attendee.email || "-"
                  }<br/>
                  <span style="color:#ffffff;">Phone:</span> ${
                    attendee.phone || "-"
                  }<br/>
                  <span style="color:#ffffff;">National ID:</span> ${
                    attendee.nationalId || "-"
                  }<br/>
                  <span style="color:#ffffff;">Gender:</span> ${
                    attendee.gender || "-"
                  }
                </td>
              </tr>
            `
        )
        .join("")
    : "";

  const firstName = String(name || "Guest").split(" ")[0] || "Guest";

  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;color:#f7f7f8;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
              <tr>
                <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#e86b2a,#fb923c);color:#0f0f10;">
                  <h1 style="margin:0;font-size:28px;letter-spacing:1px;">Clear Vision</h1>
                  <p style="margin:8px 0 0;font-size:15px;opacity:0.85;">Your QR ticket is ready</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 36px 24px 36px;color:#f7f7f8;">
                  <p style="font-size:16px;margin:0 0 16px 0;">Hi ${firstName},</p>
                  <p style="font-size:16px;margin:0 0 16px 0;">We received your payment — you’re officially on the guest list.</p>

                  <div style="background:#111113;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
                    <p style="margin:0 0 12px 0;font-size:15px;color:#ffffff;">
                      Your QR ticket is included in this email. Some email apps display images near the bottom (attachments area). Please have it ready for scanning on arrival.
                    </p>

                    <table role="presentation" width="100%" style="border-collapse:collapse;">
                      <tr>
                        <td align="center" style="padding:16px 0;">
                          <!-- IMPORTANT: this CID must match the attachment below -->
                          <img src="cid:ticket-qr" alt="Clear Vision ticket QR code" width="220" height="220" style="display:block;margin:0 auto;border-radius:8px;border:1px solid rgba(255,255,255,0.2);" />
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top:12px;background:#0f0f10;border:1px dashed rgba(255,255,255,0.18);border-radius:8px;padding:12px 14px;text-align:left;">
                      <p style="margin:0;font-size:13px;line-height:18px;color:#e5e5e5;">
                        <strong style="color:#ffffff;">Can’t see the QR above?</strong> Some email apps move images to the end of the message. Scroll to the bottom of this email (attachments area) to find your QR and present it at the door.
                      </p>
                    </div>

                    <p style="margin:16px 0 0 0;font-size:16px;color:#ffffff;">
                      Ticket ID: <span style="font-weight:600;letter-spacing:1px;color:#fb923c;">${ticketId}</span>
                    </p>
                    <p style="margin:8px 0 0 0;font-size:15px;color:#ffffff;">
                      Package: <strong style="color:#fb923c;">${
                        packageType === "couple"
                          ? "Couple Package"
                          : "Single Package"
                      }</strong>
                    </p>
                  </div>

                  <table width="100%" style="background:#111113;border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px;margin:16px 0;">
                    <tr>
                      <td style="font-size:15px;font-weight:600;color:#ffffff;padding-bottom:8px;">Attendee Details</td>
                    </tr>
                    ${attendeeSection}
                  </table>

                  ${
                    paymentUrl
                      ? `<p style="font-size:15px;margin:0 0 16px 0;color:#ffffff;">Need to review payment instructions? <a href="${paymentUrl}" style="color:#fb923c;text-decoration:none;">Visit your ticket page.</a></p>`
                      : ""
                  }

                  <p style="font-size:15px;margin:0;color:#ffffff;">Doors open at 8PM — arrive early for the full experience.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 36px 28px 36px;color:#a1a1aa;font-size:13px;line-height:20px;">
                  <p style="margin:0;">Need help? Reply to this email and we'll jump in.</p>
                  <p style="margin:12px 0 0;">© ${new Date().getFullYear()} Clear Vision. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
}

function renderRejectionEmail({ name }) {
  const firstName = String(name || "Guest").split(" ")[0] || "Guest";
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;color:#f7f7f8;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
              <tr>
                <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#6b7280,#9ca3af);color:#0f0f10;">
                  <h1 style="margin:0;font-size:28px;letter-spacing:1px;">Clear Vision</h1>
                  <p style="margin:8px 0 0;font-size:15px;opacity:0.85;">Ticket update</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 36px 24px 36px;color:#f7f7f8;">
                  <p style="font-size:16px;margin:0 0 16px 0;">Hi ${firstName},</p>
                  <p style="font-size:16px;margin:0 0 16px 0;">Thanks for your interest in Clear Vision. After reviewing your registration, we’re unable to confirm a ticket at this time.</p>
                  <p style="font-size:15px;margin:0;">If you believe this was an error, reply to this email and our team will take a look.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 36px 28px 36px;color:#a1a1aa;font-size:13px;line-height:20px;">
                  <p style="margin:12px 0 0;">© ${new Date().getFullYear()} Clear Vision. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
}
/* -------------------- end local templates -------------------- */

router.post("/confirm-payment", async (req, res) => {
  if (!adminAuth.hasAdminAccess(req)) {
    logWarn("Admin payment confirmation blocked due to invalid credentials", {
      providedApiKey: Boolean(req.header("x-admin-api-key")),
      providedBearer: Boolean((req.header("authorization") || "").trim()),
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { ticketId, note } = req.body || {};
  // Allow forced re-send even if already paid
  const forceResend =
    req.query.resend === "1" ||
    req.query.resend === "true" ||
    req.body?.resend === true;

  if (!ticketId || typeof ticketId !== "string") {
    return res.status(400).json({ message: "ticketId is required." });
  }

  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      logWarn("Admin payment confirmation attempted for missing ticket", {
        ticketId,
      });
      return res.status(404).json({ message: "Ticket not found." });
    }

    if (ticket.status === "paid" && !forceResend) {
      logInfo("Admin payment confirmation skipped; ticket already paid", {
        ticketId,
      });
      return res.json({
        message: "Already paid. Add ?resend=1 to resend emails.",
      });
    }

    const wasPaid = ticket.status === "paid";
    const now = new Date();
    if (!wasPaid) {
      ticket.status = "paid";
    }
    ticket.payment = { ...(ticket.payment || {}), updatedAt: now };

    // Save a general QR for the ticket page (not the inline image)
    const verifyUrl = getVerifyTicketUrl(ticket.ticketId);
    if (verifyUrl) {
      ticket.qrCode = await generateTicketQr(
        buildTicketQrPayload(ticket, { verifyUrl })
      );
    }

    ticket.paymentHistory = ticket.paymentHistory || [];
    ticket.paymentHistory.push({
      event:
        wasPaid || forceResend ? "admin_resent_email" : "admin_marked_paid",
      status: "paid",
      amountCents: undefined,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      note: note || (wasPaid || forceResend ? "resend" : undefined),
      createdAt: now,
    });
    if (ticket.paymentHistory.length > 200) {
      ticket.paymentHistory = ticket.paymentHistory.slice(-200);
    }

    await ticket.save();

    try {
      const attendees = Array.isArray(ticket.attendees) ? ticket.attendees : [];
      const sentTo = [];

      for (const a of attendees) {
        if (!a || !a.email) continue;

        // Unique per-attendee payload (include name + phone so scanners see them)
        const attendeePayload = {
          ticketId: ticket.ticketId,
          nationalId: a.nationalId,
          fullName: a.fullName,
          phone: a.phone,
        };
        const qrBuffer = await QRCode.toBuffer(JSON.stringify(attendeePayload));

        // Must match <img src="cid:ticket-qr"> in the template
        const attachments = [
          {
            filename: "ticket-qr.png",
            content: qrBuffer,
            contentType: "image/png",
            cid: "ticket-qr",
            contentDisposition: "inline",
          },
        ];

        await sendEmail({
          to: a.email,
          subject: "Your QR Ticket – Clear Vision",
          html: renderPaymentConfirmationEmail({
            name: a.fullName || "Guest",
            ticketId: ticket.ticketId,
            packageType: ticket.packageType,
            attendees: ticket.attendees,
            paymentUrl: getTicketPageUrl(ticket.ticketId),
          }),
          template: "payment-confirmation",
          ticketId: ticket.ticketId,
          metadata: {
            via: "adminVerify",
            status: "paid",
            nationalId: a.nationalId,
            to: a.email,
          },
          attachments,
        });

        sentTo.push(a.email);
      }

      ticket.payment = ticket.payment || {};
      ticket.payment.emailSentAt = new Date();
      ticket.payment.updatedAt = new Date();
      ticket.payment.lastEmailError = undefined;
      await ticket.save();

      logInfo("Admin payment confirmation email(s) sent", { ticketId, sentTo });
    } catch (emailError) {
      ticket.payment = ticket.payment || {};
      ticket.payment.lastEmailError = emailError.message;
      ticket.payment.updatedAt = new Date();
      await ticket.save();
      logError("Admin payment confirmation email failed", {
        ticketId,
        error: emailError.message,
      });
    }

    logInfo("Admin payment manually confirmed", { ticketId });
    if (ticket.packageType === "couple") {
      console.log("✔ Ticket marked paid - couple", ticket.ticketId);
    }
    return res.json({
      message:
        wasPaid || forceResend
          ? "Email re-sent."
          : "Marked paid and email sent.",
    });
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
          ...(ticket.attendees || []).map((a) => a.email),
        ].filter(Boolean)
      )
    );
    const primaryName = ticket.attendees?.[0]?.fullName || "Guest";

    try {
      await Promise.all(
        declineRecipients.map((recipient) =>
          sendEmail({
            to: recipient,
            subject: "Clear Vision Ticket Update",
            html: renderRejectionEmail({ name: primaryName }),
          })
        )
      );
      logInfo("Admin decline notification email sent", { ticketId });
    } catch (emailError) {
      logError("Admin decline email failed", {
        ticketId,
        error: emailError.message,
      });
    }

    logInfo("Admin payment manually declined", { ticketId, reason });
    return res.json({ message: "Payment declined." });
  } catch (error) {
    logError("Admin decline failed", { ticketId, error: error.message });
    return res.status(500).json({ message: "Failed to decline payment." });
  }
});

module.exports = router;
