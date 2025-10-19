const Ticket = require("../models/Ticket");
const { sendEmail } = require("../utils/sendEmail");
const { buildPaymentConfirmationEmail } = require("../utils/emailTemplates");
const { buildTicketQrPayload } = require("../utils/qr");
const QRCode = require("qrcode");

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
      {
        $or: [{ ticketId: id }, { _id: id }],
      },
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

    const ticket = await Ticket.findById(ticketId);
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
      const qrPayload = buildTicketQrPayload(ticket);
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Send email to each attendee
      for (const attendee of ticket.attendees) {
        const emailHtml = buildPaymentConfirmationEmail({
          name: attendee.fullName,
          ticketId: ticket.ticketId,
          packageType: ticket.packageType,
          attendees: ticket.attendees,
          paymentUrl: `${process.env.CLIENT_URL}/ticket/${ticket.ticketId}`,
          qrBase64: qrCodeDataURL.split(",")[1], // Remove data:image/png;base64, prefix
        });

        await sendEmail({
          to: attendee.email,
          subject: `🎫 Your Midnight Madness Ticket is Ready! (${ticket.ticketId})`,
          html: emailHtml,
          template: "payment_confirmation",
          ticketId: ticket.ticketId,
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
};
