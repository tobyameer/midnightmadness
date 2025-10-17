const { v4: uuidv4 } = require('uuid');

/**
 * Generates a collision-resistant ticket identifier that is short enough for manual lookup.
 * @returns {string} Ticket identifier e.g. MM-AB12CD-4832
 */
function generateTicketId() {
  const slug = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  const suffix = Date.now().toString().slice(-4);
  return `MM-${slug}-${suffix}`;
}

module.exports = { generateTicketId };
