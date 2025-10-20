const express = require("express");
const {
  manualRegistration,
  listPendingTickets,
  listPaidTickets,
  verifyTicket,
  markAsPaid,
  resendTicket,
} = require("../controllers/ticketController");

const router = express.Router();

// Public/manual endpoints
router.post("/manual", manualRegistration);
router.post("/verify", verifyTicket);

// Admin list (you can wrap these with admin auth later)
router.get("/pending", listPendingTickets);
router.get("/paid", listPaidTickets);

// Admin actions
router.post("/:ticketId/mark-paid", markAsPaid);
router.post("/:ticketId/resend", resendTicket);

module.exports = router;
