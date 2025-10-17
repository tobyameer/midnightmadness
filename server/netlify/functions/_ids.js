const { customAlphabet } = require("nanoid");

// Matches your "MM-XXXXXXX-1234" vibe
const hex = customAlphabet("0123456789ABCDEF", 8);

function generateTicketId() {
  return `MM-${hex()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

module.exports = { generateTicketId };
