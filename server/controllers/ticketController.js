const Ticket = require("../models/Ticket");

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

module.exports = {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  checkInTicket,
  deleteTicket,
  getTicketStats,
};
