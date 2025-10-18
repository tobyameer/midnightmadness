const express = require("express");
const {
  manualRegistration,
  listPendingTickets,
  listPaidTickets,
  verifyTicket,
  markAsPaid,
} = require("../controllers/ticketController");

const router = express.Router();

// Public/manual endpoints
router.post("/manual", manualRegistration);
router.post("/verify", verifyTicket);

// Admin list (you can wrap these with admin auth later)
router.get("/pending", listPendingTickets);
router.get("/paid", listPaidTickets);

// Admin action
router.post("/:ticketId/mark-paid", markAsPaid);

module.exports = router;
