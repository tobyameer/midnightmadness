const Ticket = require("../models/Ticket");
const { sendEmail } = require("../utils/sendEmail");
const { buildPaymentConfirmationEmail } = require("../utils/emailTemplates");
const { buildTicketQrPayload } = require("../utils/qr");
const qrcode = require("qrcode");

/**
 * Get all tickets with optional filtering
 */
async function getAllTickets(req, res) {
  try {
    const { status, search } = req.query;
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { ticketId: searchRegex },
        { contactEmail: searchRegex },
        { "attendees.fullName": searchRegex },
        { "attendees.email": searchRegex },
        { "attendees.nationalId": searchRegex },
      ];
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
    });
  }
}

/**
 * Get ticket by ID
 */
async function getTicketById(req, res) {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id }],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
    });
  }
}

/**
 * Update ticket status
 */
async function updateTicketStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "pending_manual_payment",
      "active",
      "paid",
      "cancelled",
      "used",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: id },
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.json({
      success: true,
      ticket,
      message: `Ticket status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update ticket status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
    });
  }
}

/**
 * Check in a ticket
 */
async function checkInTicket(req, res) {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id }],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "paid" && ticket.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Ticket is not valid for check-in",
      });
    }

    if (ticket.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "Ticket already checked in",
        checkedInAt: ticket.checkedInAt,
      });
    }

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    ticket.status = "used";
    await ticket.save();

    return res.json({
      success: true,
      ticket,
      message: "Ticket checked in successfully",
    });
  } catch (error) {
    console.error("Check in ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check in ticket",
    });
  }
}

/**
 * Delete ticket
 */
async function deleteTicket(req, res) {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOneAndDelete({
      $or: [{ ticketId: id }, { _id: id }],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
}

/**
 * Get ticket statistics
 */
async function getTicketStats(req, res) {
  try {
    const totalTickets = await Ticket.countDocuments();
    const pendingTickets = await Ticket.countDocuments({
      status: "pending_manual_payment",
    });
    const paidTickets = await Ticket.countDocuments({
      status: { $in: ["paid", "active"] },
    });
    const usedTickets = await Ticket.countDocuments({
      status: "used",
    });
    const cancelledTickets = await Ticket.countDocuments({
      status: "cancelled",
    });

    return res.json({
      success: true,
      stats: {
        total: totalTickets,
        pending: pendingTickets,
        paid: paidTickets,
        used: usedTickets,
        cancelled: cancelledTickets,
      },
    });
  } catch (error) {
    console.error("Get ticket stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
}

/**
 * Manual registration endpoint
 */
async function manualRegistration(req, res) {
  try {
    const { packageType, contactEmail, attendees } = req.body;

    if (
      !packageType ||
      !contactEmail ||
      !attendees ||
      !Array.isArray(attendees)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: packageType, contactEmail, attendees",
      });
    }

    // Check for duplicate emails
    const attendeeEmails = attendees.map((a) => a.email.toLowerCase());
    const existingTicket = await Ticket.findOne({
      $or: [
        { contactEmail: contactEmail.toLowerCase() },
        { "attendees.email": { $in: attendeeEmails } },
      ],
    });

    if (existingTicket) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered. Please use a different email address.",
        duplicateEmail: contactEmail,
      });
    }

    // ✅ FIXED: Generate ticketId before creating the ticket
    const { generateTicketId } = require("../utils/id");
    const ticketId = await generateTicketId();

    // Create ticket with the generated ticketId
    const ticket = new Ticket({
      ticketId,
      packageType,
      contactEmail,
      attendees,
      status: "pending_manual_payment",
    });

    await ticket.save();

    return res.json({
      success: true,
      ticketId: ticket.ticketId,
      status: ticket.status,
    });
  } catch (error) {
    console.error("Manual registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register ticket",
    });
  }
}

/**
 * List pending tickets
 */
async function listPendingTickets(req, res) {
  try {
    const tickets = await Ticket.find({ status: "pending_manual_payment" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("List pending tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending tickets",
    });
  }
}

/**
 * List paid tickets
 */
async function listPaidTickets(req, res) {
  try {
    const tickets = await Ticket.find({ status: "paid" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("List paid tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch paid tickets",
    });
  }
}

/**
 * Verify ticket
 */
async function verifyTicket(req, res) {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    const ticket = await Ticket.findOne({ _id: ticketId, status: "active" });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found or not active",
      });
    }

    return res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Verify ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify ticket",
    });
  }
}

/**
 * Mark ticket as paid
 */
async function markAsPaid(req, res) {
  try {
    const { ticketId } = req.params;
    console.log("Mark as paid - ticketId:", ticketId);

    const ticket = await Ticket.findOne({ ticketId: ticketId });
    console.log(
      "Mark as paid - found ticket:",
      ticket ? ticket.ticketId : "NOT FOUND"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = "paid";
    await ticket.save();
    console.log("Mark as paid - ticket saved successfully");

    // Send QR code emails to all attendees
    try {
      // Generate QR as PNG buffer for CID attachment
      const publicVerifyUrl = new URL(
        `/api/verify-ticket/${ticket.ticketId}`,
        process.env.BACKEND_VERIFY_BASE_URL ||
          process.env.BACKEND_BASE_URL ||
          process.env.CLIENT_URL
      ).toString();

      const qrBuffer = await qrcode.toBuffer(publicVerifyUrl, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 8,
        color: { dark: "#000000", light: "#FFFFFFFF" },
      });

      const cid = `ticket-qr-${ticket.ticketId}@clearvision`;
      console.log("Email: attaching QR", {
        ticketId: ticket.ticketId,
        cid,
        qrSize: qrBuffer?.length,
      });

      // Send email to each attendee
      for (const attendee of ticket.attendees) {
        const emailHtml = buildPaymentConfirmationEmail({
          name: attendee.fullName,
          ticketId: ticket.ticketId,
          packageType: ticket.packageType,
          attendees: ticket.attendees,
          paymentUrl: `${process.env.CLIENT_URL}/ticket/${ticket.ticketId}`,
          qrCid: cid,
        });

        await sendEmail({
          to: attendee.email,
          subject: `🎫 Your Clear Vision Ticket is Ready! (${ticket.ticketId})`,
          html: emailHtml,
          template: "payment_confirmation",
          ticketId: ticket.ticketId,
          attachments: [
            {
              filename: `qr-${ticket.ticketId}.png`,
              content: qrBuffer,
              contentType: "image/png",
              cid,
            },
          ],
          metadata: {
            attendeeName: attendee.fullName,
            packageType: ticket.packageType,
          },
        });

        console.log(
          `QR code email sent to ${attendee.email} for ticket ${ticket.ticketId}`
        );
      }

      console.log(
        `All QR code emails sent successfully for ticket ${ticket.ticketId}`
      );
    } catch (emailError) {
      console.error("Failed to send QR code emails:", emailError);
      // Don't fail the entire operation if email fails
    }

    return res.json({
      success: true,
      message: "Ticket marked as paid and QR codes sent",
      ticket,
    });
  } catch (error) {
    console.error("Mark as paid error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to mark ticket as paid",
      error: error.message,
    });
  }
}

/**
 * Resend ticket email
 */
async function resendTicket(req, res) {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    console.log(`Resending ticket email for: ${ticketId}`);

    // Find the ticket
    console.log(`Looking for ticket with ID: ${ticketId}`);
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      console.log(`Ticket not found: ${ticketId}`);
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    console.log(`Found ticket: ${ticket.ticketId}, status: ${ticket.status}`);

    // Check if ticket is paid
    if (ticket.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Can only resend emails for paid tickets",
      });
    }

    // Generate QR code as PNG buffer for CID attachment
    console.log(`Generating QR code for ticket: ${ticket.ticketId}`);
    const publicVerifyUrl = new URL(
      `/api/verify-ticket/${ticket.ticketId}`,
      process.env.BACKEND_VERIFY_BASE_URL ||
        process.env.BACKEND_BASE_URL ||
        process.env.CLIENT_URL
    ).toString();
    console.log(`QR data:`, publicVerifyUrl);

    const qrBuffer = await qrcode.toBuffer(publicVerifyUrl, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 8,
      color: { dark: "#000000", light: "#FFFFFFFF" },
    });
    console.log(`QR code generated successfully`);

    const cid = `ticket-qr-${ticket.ticketId}@clearvision`;
    console.log("Email: attaching QR", {
      ticketId: ticket.ticketId,
      cid,
      qrSize: qrBuffer?.length,
    });

    // Send email to each attendee
    console.log(`Sending emails to ${ticket.attendees.length} attendees`);
    let emailSuccess = true;
    let emailError = null;

    for (const attendee of ticket.attendees) {
      console.log(`Sending email to: ${attendee.email}`);
      const emailHtml = buildPaymentConfirmationEmail({
        name: attendee.fullName,
        ticketId: ticket.ticketId,
        packageType: ticket.packageType,
        attendees: ticket.attendees,
        paymentUrl: `${process.env.CLIENT_URL}/ticket/${ticket.ticketId}`,
        qrCid: cid,
      });

      try {
        await sendEmail({
          to: attendee.email,
          subject: `🎫 Your Clear Vision Ticket is Ready! (${ticket.ticketId})`,
          html: emailHtml,
          template: "payment_confirmation",
          ticketId: ticket.ticketId,
          attachments: [
            {
              filename: `qr-${ticket.ticketId}.png`,
              content: qrBuffer,
              contentType: "image/png",
              cid,
            },
          ],
          metadata: {
            attendeeName: attendee.fullName,
            packageType: ticket.packageType,
            resend: true,
          },
        });
        console.log(`Email sent successfully to: ${attendee.email}`);
      } catch (emailErr) {
        console.log(`Email failed for ${attendee.email}:`, emailErr.message);
        emailSuccess = false;
        emailError = emailErr.message;
      }
    }

    // Return success even if email fails (for development)
    return res.json({
      success: true,
      message: emailSuccess
        ? "Ticket email resent successfully"
        : `Ticket processed successfully, but email sending failed: ${emailError}`,
    });
  } catch (error) {
    console.error("Resend ticket error:", error);

    // If it's an email configuration error, return a more specific message
    if (error.message && error.message.includes("Invalid login")) {
      return res.status(500).json({
        success: false,
        message:
          "Email service not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.",
      });
    }

    return res.status(500).json({
      success: false,
      message: `Failed to resend ticket email: ${error.message}`,
    });
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  checkInTicket,
  deleteTicket,
  getTicketStats,
  manualRegistration,
  listPendingTickets,
  listPaidTickets,
  verifyTicket,
  markAsPaid,
  resendTicket,
};
