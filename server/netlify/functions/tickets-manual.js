const { connect } = require("./_db");
const getTicketModel = require("./_ticketModel");
const { generateTicketId } = require("./_id");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Egyptian ID quick gender detection: 13th digit (index 12)
// odd = male, even = female. If invalid -> "unknown"
function detectGenderFromEgyptianId(nid) {
  if (!/^\d{14}$/.test(nid)) return "unknown";
  const thirteenth = parseInt(nid[12], 10);
  if (Number.isNaN(thirteenth)) return "unknown";
  return thirteenth % 2 === 1 ? "male" : "female";
}

function cleanString(v) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim();
}
function cleanEmail(v) {
  return cleanString(v).toLowerCase();
}
function cleanPhone(v) {
  return String(v || "")
    .replace(/[^0-9+]/g, "")
    .trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const packageTypeRaw = cleanString(body.packageType).toLowerCase();
    const attendeesInput = Array.isArray(body.attendees) ? body.attendees : [];
    const paymentNote = cleanString(body.paymentNote);

    const packageType = ["single", "couple"].includes(packageTypeRaw)
      ? packageTypeRaw
      : null;
    if (!packageType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid package type." }),
      };
    }

    const expected = packageType === "single" ? 1 : 2;
    if (attendeesInput.length !== expected) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message:
            packageType === "single"
              ? "Single package requires exactly one attendee."
              : "Couple package requires exactly two attendees.",
        }),
      };
    }

    const attendees = attendeesInput.map((raw, i) => {
      const fullName = cleanString(raw.fullName);
      const email = cleanEmail(raw.email);
      const phone = cleanPhone(raw.phone);
      const nationalId = cleanString(raw.nationalId);

      if (!fullName || !email || !phone || !nationalId) {
        throw new Error(`Attendee #${i + 1} is missing required fields.`);
      }
      if (!/^\d{14}$/.test(nationalId)) {
        throw new Error(`Attendee #${i + 1} national ID must be 14 digits.`);
      }

      return {
        fullName,
        email,
        phone,
        nationalId,
        gender: detectGenderFromEgyptianId(nationalId),
      };
    });

    if (packageType === "couple") {
      const genders = attendees.map((a) => a.gender);
      if (!(genders.includes("male") && genders.includes("female"))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Couples package requires one male and one female.",
          }),
        };
      }
      if (attendees[0].nationalId === attendees[1].nationalId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Each attendee must have a unique national ID.",
          }),
        };
      }
      if (attendees[0].email === attendees[1].email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Each attendee must use a unique email address.",
          }),
        };
      }
      if (attendees[0].phone === attendees[1].phone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Each attendee must use a unique phone number.",
          }),
        };
      }
    }

    // Contact email = first attendee email
    const contactEmail = attendees[0].email;

    await connect();
    const Ticket = getTicketModel();

    // Block duplicates by nationalId
    const nationalIds = attendees.map((a) => a.nationalId);
    const existing = await Ticket.findOne({
      "attendees.nationalId": { $in: nationalIds },
    }).lean();
    if (existing) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          message: "A ticket already exists for one of the national IDs.",
        }),
      };
    }

    const ticketId = generateTicketId();
    await Ticket.create({
      ticketId,
      packageType,
      contactEmail,
      paymentNote: paymentNote || undefined,
      attendees,
      status: "pending_manual_payment",
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ ticketId, status: "pending_manual_payment" }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: err.message || "Registration failed. Please try again.",
      }),
    };
  }
};
