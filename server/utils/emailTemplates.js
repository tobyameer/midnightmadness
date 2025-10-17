// server/utils/emailTemplates.js

function normalizeUrl(baseUrl, ticketId) {
  if (!baseUrl) return "";
  const sanitizedBase = baseUrl.replace(/\/$/, "");
  return `${sanitizedBase}/payment/${ticketId}`;
}

function layout({ title, body }) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0D0B0C;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;color:#ffffff;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#1A1314;border-radius:16px;overflow:hidden;border:1px solid rgba(215,70,50,0.3);">
          <tr>
            <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#d74632,#a22e1f);color:#ffffff;">
              <h1 style="margin:0;font-size:28px;letter-spacing:1px;color:#ffffff;">Clear Vision</h1>
              <p style="margin:8px 0 0;font-size:15px;color:#ffffff;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 24px 36px;color:#ffffff;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px 36px;color:#ffffff;font-size:13px;line-height:20px;">
              <p style="margin:0;color:#ffffff;">Having trouble? Reply directly to this email and our team will help you out.</p>
              <p style="margin:12px 0 0;color:#ffffff;">© ${new Date().getFullYear()} Clear Vision. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

function buildRegistrationEmail({ name, ticketId, paymentUrl }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <p style="font-size:16px;margin:0 0 16px 0;color:#ffffff;">Hi ${firstName},</p>
    <p style="font-size:16px;margin:0 0 16px 0;color:#ffffff;">
      Thanks for registering for <strong>Clear Vision</strong>! Your ticket is reserved and awaiting payment.
    </p>
    <div style="background:#111113;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0;font-size:17px;font-weight:600;color:#ffffff;">Ticket ID</p>
      <p style="margin:4px 0 12px 0;font-size:20px;letter-spacing:1px;color:#d74632;">${ticketId}</p>
      <p style="margin:0 0 12px 0;font-size:15px;line-height:22px;color:#ffffff;">
        Complete your payment to lock in your spot. You can choose Vodafone Cash or InstaPay.
      </p>
      ${
        paymentUrl
          ? `<a href="${paymentUrl}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#d74632;color:#0D0B0C !important;font-weight:600;text-decoration:none;">Complete Payment</a>`
          : ""
      }
    </div>
    <p style="font-size:15px;margin:0;color:#ffffff;">
      Keep this email handy. We can't wait to see you under the midnight lights!
    </p>
  `;
  return layout({ title: "Your registration is confirmed", body });
}

/**
 * IMPORTANT: This template expects an inline PNG attachment with CID "ticket-qr".
 * The sender must attach: { filename: "...png", content: <buffer>, contentType: "image/png", cid: "ticket-qr", contentDisposition: "inline" }
 */
function buildPaymentConfirmationEmail({
  name,
  ticketId,
  paymentUrl,
  packageType,
  attendees,
}) {
  const attendeeRows = Array.isArray(attendees)
    ? attendees
        .map(
          (a) => `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#ffffff;">
            <strong style="color:#ffffff;">${
              a?.fullName || "Guest"
            }</strong><br/>
            <span style="color:#ffffff;">Email:</span> ${
              a?.email
                ? `<a href="mailto:${a.email}" style="color:#ffffff !important; text-decoration:none !important;">${a.email}</a>`
                : "-"
            }<br/>
            <span style="color:#ffffff;">Phone:</span> ${
              a?.phone
                ? `<a href="tel:${a.phone}" style="color:#ffffff !important; text-decoration:none !important;">${a.phone}</a>`
                : "-"
            }<br/>
            <span style="color:#ffffff;">National ID:</span> ${
              a?.nationalId || "-"
            }<br/>
            <span style="color:#ffffff;">Gender:</span> ${a?.gender || "-"}
          </td>
        </tr>
      `
        )
        .join("")
    : "";

  const firstName = (name || "there").split(" ")[0];

  const body = `
    <p style="font-size:16px;margin:0 0 16px 0;color:#ffffff;">Hi ${firstName},</p>
    <p style="font-size:16px;margin:0 0 16px 0;color:#ffffff;">
      We received your payment — you’re officially on the Clear Vision guest list.
    </p>
    <div style="background:#111113;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 12px 0;font-size:15px;color:#ffffff;">
        Your QR ticket is included in this email. Some email apps display images near the bottom (attachments area). Please have it ready for scanning on arrival.
      </p>
      <table role="presentation" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:16px 0;">
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
        Ticket ID: <span style="font-weight:600;letter-spacing:1px;color:#d74632;">${ticketId}</span>
      </p>
      <p style="margin:8px 0 0 0;font-size:15px;color:#ffffff;">
        Package: <strong style="color:#d74632;">${
          packageType === "couple" ? "Couple Package" : "Single Package"
        }</strong>
      </p>
    </div>
    <table width="100%" style="background:#111113;border:1px solid rgba(215,70,50,0.2);border-radius:12px;padding:16px;margin:16px 0;">
      <tr>
        <td style="font-size:15px;font-weight:600;color:#ffffff;padding-bottom:8px;">Attendee Details</td>
      </tr>
      ${attendeeRows}
    </table>
    <p style="font-size:15px;margin:0 0 16px 0;color:#ffffff;">
      ${
        paymentUrl
          ? `Need to review payment instructions? <a href="${paymentUrl}" style="color:#d74632 !important; text-decoration:none !important;">Visit your ticket page.</a>`
          : "Keep this QR code safe and we’ll see you at the entrance."
      }
    </p>
    <p style="font-size:15px;margin:0;color:#ffffff;">Doors open at 8PM — arrive early for the full experience.</p>
  `;
  return layout({ title: "Your QR ticket is ready!", body });
}

function buildRejectionEmail({ name }) {
  const firstName = (name || "there").split(" ")[0];
  const body = `
    <p style="font-size:16px;margin:0 0 16px 0;color:#ffffff;">Hi ${firstName},</p>
    <p style="font-size:16px;margin:0 0 16px 0;color:#ffffff;">
      Thank you for your interest in Clear Vision. After reviewing your registration we’re unable to confirm a ticket at this time.
    </p>
    <p style="font-size:15px;margin:0;color:#ffffff;">
      We hope to see you at a future event. If you believe this was made in error, just reply to this email and our team will investigate.
    </p>
  `;
  return layout({ title: "Ticket update", body });
}

module.exports = {
  buildRegistrationEmail,
  buildPaymentConfirmationEmail,
  buildRejectionEmail,
  normalizeUrl,
};
