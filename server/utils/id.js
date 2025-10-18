const { randomUUID } = require("crypto");
function generateTicketId() {
  const chunk = randomUUID().split("-")[0].toUpperCase();
  return `MM-${chunk}-${Math.floor(1000 + Math.random() * 9000)}`;
}
module.exports = { generateTicketId };
