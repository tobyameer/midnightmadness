const express = require("express");
const router = express.Router();

router.get("/ping", (_req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

module.exports = router;
