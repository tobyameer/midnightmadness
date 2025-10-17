// Import from local backend copy (pure CommonJS)
const { validateEgyptianId, getEgyptianIdGender } = require("./egyptIdCore");

module.exports = {
  validateEgyptianId,
  getEgyptianIdGender,
};
