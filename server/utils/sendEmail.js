const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html, template, ticketId, metadata, attachments }) {
  const mail = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };

  let status = "success";
  let errorMessage = undefined;

  try {
    await transporter.sendMail(mail);
  } catch (err) {
    status = "failed";
    errorMessage = err?.message || String(err);
    console.warn("sendEmail failed:", errorMessage);
  }

  try {
    await EmailLog.create({
      ticketId,
      to,
      subject,
      template,
      meta: metadata,
      status,
      error: errorMessage,
      attempt: 1,
      sentAt: new Date(),
    });
  } catch (logErr) {
    console.warn("Failed to persist email log:", logErr?.message || logErr);
  }

  if (status === "failed") {
    const e = new Error(errorMessage || "Email send failed");
    e.status = "failed";
    throw e;
  }

  return { ok: true };
}

module.exports = { sendEmail };
