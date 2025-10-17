const { sendEmail } = require("./sendEmail");
const { buildPaymentConfirmationEmail } = require("./emailTemplates");

/**
 * Sends the payment confirmation email containing the QR ticket.
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.name
 * @param {string} params.ticketId
 * @param {string} params.qrCodeDataUrl
 * @param {string} params.paymentUrl
 */
async function sendTicketEmail({
  to,
  name,
  ticketId,
  qrCodeDataUrl,
  paymentUrl,
  packageType,
  attendees,
}) {
  const recipients = Array.isArray(to)
    ? Array.from(new Set(to.filter(Boolean)))
    : [to].filter(Boolean);

  if (!recipients.length || !qrCodeDataUrl) {
    console.warn("⚠️ Missing email destination or QR code data.");
    return;
  }

  const base64 = qrCodeDataUrl.split(",")[1];
  const buffer = Buffer.from(base64, "base64");

  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient,
        subject: "🎟 Your Clear Vision QR Ticket",
        html: buildPaymentConfirmationEmail({
          name,
          ticketId,
          paymentUrl,
          packageType,
          attendees,
        }),
        attachments: [
          {
            filename: `ticket-${ticketId}.png`,
            content: buffer,
            cid: "",
          },
        ],
        template: "ticket-confirmation",
        ticketId,
        metadata: { paymentUrl: Boolean(paymentUrl) },
      })
    )
  );
}

module.exports = { sendTicketEmail };
