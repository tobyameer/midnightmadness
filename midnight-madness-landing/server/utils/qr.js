const QRCode = require('qrcode');

/**
 * Generates a base64 data URL containing the QR code for the provided payload.
 * @param {object} payload - Object to encode into the QR image (typically contains the ticketId).
 * @returns {Promise<string>} Data URL representation of the QR code image.
 */
async function generateTicketQr(payload) {
  const jsonPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return QRCode.toDataURL(jsonPayload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

function buildTicketQrPayload(ticket, extras = {}) {
  if (!ticket) {
    return extras;
  }

  const attendees = Array.isArray(ticket.attendees)
    ? ticket.attendees.map((attendee) => ({
        fullName: attendee.fullName,
        email: attendee.email,
        phone: attendee.phone,
        nationalId: attendee.nationalId,
      }))
    : [];

  return {
    ticketId: ticket.ticketId,
    packageType: ticket.packageType,
    attendees,
    ...extras,
  };
}

module.exports = { generateTicketQr, buildTicketQrPayload };
