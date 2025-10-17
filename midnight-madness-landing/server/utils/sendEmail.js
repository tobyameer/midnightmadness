const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");
const { logError, logWarn, logInfo } = require("./logger");

let cachedTransporter;

function getEmailConfig() {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
  } = process.env;

  const sanitizedUser = (EMAIL_USER || "").trim();
  const sanitizedPass = (EMAIL_PASS || "").replace(/\s+/g, "");
  const sanitizedFrom = (EMAIL_FROM || "").trim();

  const rawPort = (EMAIL_PORT || "").trim();
  const rawSecure = String(EMAIL_SECURE ?? "")
    .trim()
    .toLowerCase();

  return {
    host: (EMAIL_HOST || "").trim(),
    port: rawPort ? Number(rawPort) : 587,
    secure: rawSecure === "true",
    user: sanitizedUser,
    pass: sanitizedPass,
    from: sanitizedFrom,
  };
}

function logCredentialStatus(pass) {
  if (pass && pass.length === 16) {
    console.log("✅ Using Gmail App Password auth");
  } else if (pass) {
    console.warn(
      "❌ EMAIL_PASS length looks off. Make sure you paste the 16 character Gmail App Password without spaces."
    );
  } else {
    console.warn(
      "❌ EMAIL_PASS missing. Use a Gmail App Password (16 characters)."
    );
  }
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getEmailConfig();

  if (!config.user || !config.pass) {
    console.warn("⚠️ Email credentials missing – skipping email send.");
    return null;
  }

  const useGmail = !config.host;

  if (useGmail) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    logCredentialStatus(config.pass);
  } else {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return cachedTransporter;
}

function buildFromAddress() {
  const { from, user } = getEmailConfig();
  if (from) {
    return from;
  }
  if (!user) {
    return undefined;
  }
  return `Clear Vision <${user}>`;
}

/**
 * Sends an email using the configured transporter.
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {Array<object>} [options.attachments]
 */
async function recordEmailLog({
  ticketId,
  to,
  template,
  status,
  error,
  attempt,
  metadata,
}) {
  try {
    await EmailLog.create({
      ticket: ticketId || undefined,
      to,
      template,
      status,
      error,
      attempt,
      metadata,
    });
  } catch (logErr) {
    logWarn("Failed to persist email log", { error: logErr.message });
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
  template = "generic",
  ticketId,
  metadata,
  maxAttempts = 3,
}) {
  if (!to) {
    console.warn("⚠️ Email destination missing – skipping email send.");
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    return;
  }

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await transporter.sendMail({
        from: buildFromAddress(),
        to,
        subject,
        html,
        attachments,
      });
      await recordEmailLog({
        ticketId,
        to,
        template,
        status: "success",
        attempt,
        metadata,
      });
      if (attempt > 1) {
        logInfo("Email send succeeded after retry", { to, template, attempt });
      }
      return;
    } catch (error) {
      lastError = error;
      await recordEmailLog({
        ticketId,
        to,
        template,
        status: "failed",
        error: error.message,
        attempt,
        metadata,
      });
      logWarn("Email send failed", {
        to,
        template,
        attempt,
        error: error.message,
      });
      if (attempt < maxAttempts) {
        const delay = 500 * attempt ** 2;
        await wait(delay);
      }
    }
  }

  if (lastError) {
    logError("Email send failed after retries", {
      to,
      template,
      error: lastError.message,
    });
    throw lastError;
  }
}

module.exports = { sendEmail, getTransporter, buildFromAddress };
