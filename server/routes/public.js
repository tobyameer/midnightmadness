const express = require('express');
const { buildPublicPricingSnapshot } = require('../config/pricing');
const { buildClientRuntimeConfig } = require('../config/runtime');

const router = express.Router();

router.get('/api/public/pricing', (_req, res) => {
  res.json(buildClientRuntimeConfig());
});

// Backwards compatibility for older clients.
router.get('/api/public/config', (_req, res) => {
  res.json(buildPublicPricingSnapshot());
});

module.exports = router;
