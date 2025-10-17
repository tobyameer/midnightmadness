const express = require('express');
const { coreRequest } = require('../coreClient');

const router = express.Router();

router.get('/pending', async (_req, res) => {
  try {
    const pendingResponse = await coreRequest({
      method: 'GET',
      url: '/api/tickets/pending',
    });

    const tickets = Array.isArray(pendingResponse?.tickets)
      ? pendingResponse.tickets
      : Array.isArray(pendingResponse)
        ? pendingResponse
        : [];

    return res.json({ tickets });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Failed to load pending tickets.' });
  }
});

router.get('/paid', async (req, res) => {
  try {
    const { search } = req.query;
    const response = await coreRequest({
      method: 'GET',
      url: '/api/tickets/paid',
      params: search ? { search } : undefined,
    });
    const tickets = Array.isArray(response?.tickets)
      ? response.tickets
      : Array.isArray(response)
        ? response
        : [];
    return res.json({ tickets });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Failed to load paid tickets.' });
  }
});

router.post('/:ticketId/mark-paid', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const response = await coreRequest({
      method: 'POST',
      url: '/api/admin/confirm-payment',
      data: { ticketId, note: req.body?.note },
    });

    return res.json(response);
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Failed to confirm payment.' });
  }
});

router.post('/:ticketId/decline', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body || {};

    const response = await coreRequest({
      method: 'POST',
      url: '/api/admin/decline-payment',
      data: {
        ticketId,
        reason,
      },
    });

    return res.json(response);
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Failed to decline payment.' });
  }
});

module.exports = router;
