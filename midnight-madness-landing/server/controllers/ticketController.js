const Ticket = require("../models/Ticket");
const { generateTicketId } = require("../utils/id");
const { validateEgyptianId, getEgyptianIdGender } = require("../utils/egyptId");
const { buildTicketQrPayload } = require("../utils/qr");
const QRCode = require("qrcode");
const { sendEmail } = require("../utils/sendEmail");
const { buildPaymentConfirmationEmail } = require("../utils/emailTemplates");

function sanitizeString(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeEmail(value) {
  return sanitizeString(value).toLowerCase();
}

function sanitizePhone(value) {
  return String(value || "")
    .replace(/[^0-9+]/g, "")
    .trim();
}

async function manualRegistration(req, res) {
  const packageTypeRaw = sanitizeString(req.body.packageType).toLowerCase();
  const packageType = ["single", "couple"].includes(packageTypeRaw)
    ? packageTypeRaw
    : null;
  const paymentNote = sanitizeString(req.body.paymentNote || "");
  const attendeesInput = Array.isArray(req.body.attendees)
    ? req.body.attendees
    : [];

  if (!packageType) {
    return res.status(400).json({ message: "Invalid package type." });
  }

  const expectedCount = packageType === "single" ? 1 : 2;
  if (attendeesInput.length !== expectedCount) {
    return res.status(400).json({
      message:
        packageType === "single"
          ? "Single package requires exactly one attendee."
          : "Couple package requires exactly two attendees.",
    });
  }

  try {
    const attendees = [];

    for (let i = 0; i < attendeesInput.length; i += 1) {
      const raw = attendeesInput[i] || {};
      const fullName = sanitizeString(raw.fullName);
      const email = sanitizeEmail(raw.email);
      const phone = sanitizePhone(raw.phone);
      const nationalId = sanitizeString(raw.nationalId);
      const providedGender = sanitizeString(raw.gender).toLowerCase();

      if (!fullName || !email || !phone || !nationalId || !providedGender) {
        throw new Error(`Attendee #${i + 1} is missing required fields.`);
      }

      if (!/^\d{14}$/.test(nationalId)) {
        throw new Error(`Attendee #${i + 1} national ID must be 14 digits.`);
      }

      const validation = await validateEgyptianId(nationalId);
      if (!validation.valid) {
        throw new Error(
          validation.errors[0] || `Attendee #${i + 1} national ID is invalid.`
        );
      }

      const detectedGender = await getEgyptianIdGender(nationalId);
      if (detectedGender === "invalid") {
        throw new Error(`Attendee #${i + 1} national ID is invalid.`);
      }

      if (packageType === "single" && detectedGender !== providedGender) {
        throw new Error(
          "Single package national ID does not match selected gender."
        );
      }

      attendees.push({
        fullName,
        email,
        phone,
        nationalId,
        gender: detectedGender,
      });
    }

    if (packageType === "couple") {
      const genders = attendees.map((a) => a.gender);
      if (!(genders.includes("male") && genders.includes("female"))) {
        return res.status(400).json({
          message: "Couples package requires one male and one female.",
        });
      }
      // Ensure the two attendees are distinct and not using the same identifiers
      if (attendees[0].nationalId === attendees[1].nationalId) {
        return res
          .status(400)
          .json({ message: "Each attendee must have a unique national ID." });
      }
      if (attendees[0].email === attendees[1].email) {
        return res
          .status(400)
          .json({ message: "Each attendee must use a unique email address." });
      }
      if (attendees[0].phone === attendees[1].phone) {
        return res
          .status(400)
          .json({ message: "Each attendee must use a unique phone number." });
      }
    }

    // Build contactEmail as a STRING (use first attendee's email)
    const contactEmail = attendees[0].email;

    const nationalIds = attendees.map((a) => a.nationalId);
    const existing = await Ticket.findOne({
      "attendees.nationalId": { $in: nationalIds },
    });
    if (existing) {
      return res.status(409).json({
        message: "A ticket already exists for one of the national IDs.",
      });
    }

    const ticketId = generateTicketId();
    const ticket = await Ticket.create({
      ticketId,
      packageType,
      contactEmail: contactEmail, // Now a string, not an array
      paymentNote: paymentNote || undefined,
      attendees,
      status: "pending_manual_payment",
    });

    // QR email will be sent after payment confirmation

    return res
      .status(201)
      .json({ ticketId: ticket.ticketId, status: ticket.status });
  } catch (err) {
    console.error("❌ Ticket creation failed:", err);
    // Mongo duplicate key error handling
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      let friendlyMessage = "This information is already registered.";
      if (
        duplicateField === "contactEmail" ||
        duplicateField === "attendees.email"
      ) {
        friendlyMessage = "This email is already registered for a ticket.";
      }
      if (
        duplicateField === "attendees.nationalId" ||
        duplicateField === "nationalId"
      ) {
        friendlyMessage =
          "This national ID is already associated with a ticket.";
      }
      if (duplicateField === "attendees.phone" || duplicateField === "phone") {
        friendlyMessage =
          "This phone number is already associated with a ticket.";
      }
      return res.status(400).json({ message: friendlyMessage });
    }
    return res.status(400).json({
      message:
        err.message ||
        "Registration failed. Please try again or contact support.",
    });
  }
}

async function listPendingTickets(req, res) {
  const search = sanitizeString(req.query?.search || "");
  const criteria = {
    $or: [{ status: "pending_manual_payment" }, { status: { $exists: false } }],
  };

  if (search) {
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    criteria.$and = [
      {
        $or: [
          { ticketId: regex },
          { contactEmail: regex },
          { "attendees.fullName": regex },
          { "attendees.email": regex },
          { "attendees.phone": regex },
          { "attendees.nationalId": regex },
        ],
      },
    ];
  }

  const tickets = await Ticket.find(criteria).sort({ createdAt: -1 });
  return res.json({ tickets });
}

async function listPaidTickets(req, res) {
  const search = sanitizeString(req.query?.search || "");
  const criteria = { status: "paid" };

  if (search) {
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    criteria.$or = [
      { ticketId: regex },
      { contactEmail: regex },
      { "attendees.fullName": regex },
      { "attendees.email": regex },
      { "attendees.phone": regex },
      { "attendees.nationalId": regex },
    ];
  }

  const tickets = await Ticket.find(criteria).sort({ createdAt: -1 });
  return res.json({ tickets });
}

async function verifyTicket(req, res) {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ message: "Missing ticket code." });
  }

  try {
    let parsed = null;
    try {
      parsed = typeof code === "string" ? JSON.parse(code) : code;
    } catch (error) {
      parsed = null;
    }

    const ticketId = parsed?.ticketId || code;
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const payload = buildTicketQrPayload(ticket);
    return res.json({ valid: true, ticket: payload });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify ticket." });
  }
}

async function markAsPaid(req, res) {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({ message: "Missing ticketId." });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    // Update status if not already paid
    const wasPaid = ticket.status === "paid";
    if (!wasPaid) {
      ticket.status = "paid";
      await ticket.save();
    }

    // Optional ticket page URL for CTA
    const paymentUrl = process.env.FRONTEND_BASE_URL
      ? `${process.env.FRONTEND_BASE_URL.replace(/\/$/, "")}/payment/${
          ticket.ticketId
        }`
      : undefined;

    // Send one email per attendee with THEIR unique QR
    const sentTo = [];
    for (const a of ticket.attendees || []) {
      if (!a || !a.email) continue;

      // Build per-attendee payload so each QR is unique to the person
      const attendeePayload = {
        ticketId: ticket.ticketId,
        nationalId: a.nationalId,
      };

      const qrBuffer = await QRCode.toBuffer(JSON.stringify(attendeePayload));
      const qrBase64 = qrBuffer.toString("base64");

      await sendEmail({
        to: a.email,
        subject: "Your QR Ticket – Clear Vision",
        html: buildPaymentConfirmationEmail({
          name: a.fullName || "Guest",
          ticketId: ticket.ticketId,
          packageType: ticket.packageType,
          attendees: ticket.attendees,
          paymentUrl,
          qrBase64, // unique per attendee
        }),
        template: "payment-confirmation",
        ticketId: ticket.ticketId,
        metadata: { status: "paid", nationalId: a.nationalId, to: a.email },
      });

      sentTo.push(a.email);
    }

    return res.json({ ok: true, sentTo, alreadyPaid: wasPaid });
  } catch (error) {
    console.error("markAsPaid error", error);
    return res
      .status(500)
      .json({
        message: "Failed to mark paid & send email.",
        error: error.message,
      });
  }
}

module.exports = {
  manualRegistration,
  listPendingTickets,
  listPaidTickets,
  verifyTicket,
  markAsPaid,
};
