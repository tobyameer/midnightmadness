function buildPaymentConfirmationEmail({
  name,
  ticketId,
  packageType,
  attendees,
  paymentUrl,
  qrBase64,
  qrCid,
}) {
  const inlineImg = qrCid
    ? `cid:${qrCid}`
    : `data:image/png;base64,${qrBase64 || ""}`;

  const attendeeList = (attendees || [])
    .map(
      (a) => `
        <div style="background: #2A1F20; padding: 16px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #d74632;">
          <div style="color: #ffffff; font-weight: bold; font-size: 16px; margin-bottom: 8px;">${a.fullName}</div>
          <div style="color: #cccccc; font-size: 14px; margin: 4px 0;">📧 ${a.email}</div>
          <div style="color: #cccccc; font-size: 14px; margin: 4px 0;">📱 ${a.phone}</div>
          <div style="color: #cccccc; font-size: 14px; margin: 4px 0;">🆔 ${a.nationalId}</div>
          <div style="color: #cccccc; font-size: 14px; margin: 4px 0;">👤 ${a.gender}</div>
        </div>
      `
    )
    .join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0D0B0C;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;color:#ffffff;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#1A1314;border-radius:16px;overflow:hidden;border:1px solid rgba(215,70,50,0.3);">
          <tr>
            <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#d74632,#a22e1f);color:#ffffff;">
              <h1 style="margin:0;font-size:28px;letter-spacing:1px;color:#ffffff;">🎫 Clear Vision</h1>
              <p style="margin:8px 0 0;font-size:15px;color:#ffffff;">Your Midnight Madness Ticket is Ready!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 24px 36px;color:#ffffff;">
              <h2 style="color:#d74632;margin:0 0 20px 0;font-size:24px;">🎉 Welcome to Midnight Madness!</h2>
              <p style="font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hi <strong>${name}</strong>,</p>
              <p style="font-size:16px;line-height:1.6;margin:0 0 20px 0;">Your ticket has been confirmed and your QR code is ready! Show this QR code at the event entrance.</p>
              
              <div style="background:#2A1F20;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #d74632;">
                <h3 style="color:#d74632;margin:0 0 16px 0;font-size:18px;">🎫 Ticket Details</h3>
                <div style="margin:8px 0;"><strong style="color:#ffffff;">Ticket ID:</strong> <span style="color:#d74632;font-family:monospace;">${ticketId}</span></div>
                <div style="margin:8px 0;"><strong style="color:#ffffff;">Package:</strong> <span style="color:#d74632;text-transform:capitalize;">${packageType}</span></div>
              </div>

              <div style="text-align:center;margin:30px 0;">
                <h3 style="color:#d74632;margin:0 0 16px 0;font-size:18px;">📱 Your QR Code</h3>
                <div style="background:#ffffff;padding:20px;border-radius:12px;display:inline-block;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                  <img alt="QR Code for ${ticketId}" src="${inlineImg}" style="width:200px;height:200px;display:block;" />
                </div>
                <p style="color:#cccccc;font-size:14px;margin:12px 0 0 0;">Scan this QR code at the event entrance</p>
              </div>

              <h3 style="color:#d74632;margin:20px 0 16px 0;font-size:18px;">👥 Attendee Information</h3>
              ${attendeeList}

              ${
                paymentUrl
                  ? `
                  <div style="text-align:center;margin:30px 0;">
                    <a href="${paymentUrl}" target="_blank" style="background:linear-gradient(135deg,#d74632,#a22e1f);color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View Full Ticket Details</a>
                  </div>
                  `
                  : ""
              }

              <div style="background:#2A1F20;padding:20px;border-radius:12px;margin:20px 0;text-align:center;">
                <h3 style="color:#d74632;margin:0 0 12px 0;font-size:18px;">🎉 See You There!</h3>
                <p style="margin:0;font-size:16px;color:#ffffff;">We can't wait to see you at Midnight Madness!</p>
                <p style="margin:8px 0 0;font-size:14px;color:#cccccc;">Make sure to bring a valid ID and this QR code.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px 36px;color:#ffffff;font-size:13px;line-height:20px;">
              <p style="margin:0;color:#cccccc;">Having trouble? Reply directly to this email and our team will help you out.</p>
              <p style="margin:12px 0 0;color:#cccccc;">© ${new Date().getFullYear()} Clear Vision. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
module.exports = { buildPaymentConfirmationEmail };
