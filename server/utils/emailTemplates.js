function buildPaymentConfirmationEmail({
  name,
  ticketId,
  packageType,
  attendees,
  paymentUrl,
  qrBase64,
  qrCid,
}) {
  const inlineImg = qrCid ? `cid:${qrCid}` : `data:image/png;base64,${qrBase64 || ""}`;
  const list = (attendees || [])
    .map(
      (a) =>
        `<li><strong>${a.fullName}</strong> — ${a.email} — ${a.phone} — ${a.nationalId} — ${a.gender}</li>`
    )
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; color: #111; line-height:1.6">
    <h2>Your QR Ticket is Ready</h2>
    <p>Hi ${name},</p>
    <p>Ticket ID: <strong>${ticketId}</strong> — Package: <strong>${packageType}</strong></p>
    <p>Attendees:</p>
    <ul>${list}</ul>
    <p><img alt="QR" src="${inlineImg}" style="width:180px;height:180px;" /></p>
    ${
      paymentUrl
        ? `<p><a href="${paymentUrl}" target="_blank">View Ticket</a></p>`
        : ""
    }
    <p>See you at the event!</p>
  </div>`;
}
module.exports = { buildPaymentConfirmationEmail };
