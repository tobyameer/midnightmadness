const express = require('express');
const {
  manualRegistration,
  listPendingTickets,
  listPaidTickets,
  verifyTicket,
} = require('../controllers/ticketController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/manual', manualRegistration);
router.get('/pending', adminAuth, listPendingTickets);
router.get('/paid', adminAuth, listPaidTickets);
router.post('/verify', verifyTicket);

module.exports = router;
