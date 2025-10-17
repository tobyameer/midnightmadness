// Direct CommonJS import - egyptIdCore.js has CommonJS compatibility
const egyptIdCore = require("../../shared/egyptIdCore.js");

// Use the exports directly or from default
const validateEgyptianId =
  egyptIdCore.validateEgyptianId || egyptIdCore.default?.validateEgyptianId;
const getEgyptianIdGender =
  egyptIdCore.getEgyptianIdGender || egyptIdCore.default?.getEgyptianIdGender;

if (!validateEgyptianId || !getEgyptianIdGender) {
  throw new Error("Failed to import Egyptian ID utilities");
}

module.exports = {
  validateEgyptianId,
  getEgyptianIdGender,
};
