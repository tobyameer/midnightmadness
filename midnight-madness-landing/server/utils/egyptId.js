const path = require("path");
const { pathToFileURL } = require("url");

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, "../../shared/egyptIdCore.js")
).href;

let validatorPromise;

function loadValidator() {
  if (!validatorPromise) {
    validatorPromise = import(moduleUrl).then((mod) => {
      const candidate =
        mod.validateEgyptianId || (mod.default && mod.default.validateEgyptianId);
      const getGenderFn =
        mod.getEgyptianIdGender || (mod.default && mod.default.getEgyptianIdGender);
      if (typeof candidate !== "function") {
        throw new Error("validateEgyptianId export missing from shared/egyptIdCore.js");
      }
      if (typeof getGenderFn !== "function") {
        throw new Error("getEgyptianIdGender export missing from shared/egyptIdCore.js");
      }
      return { validateEgyptianId: candidate, getEgyptianIdGender: getGenderFn };
    });
  }
  return validatorPromise;
}

async function validateEgyptianId(nid, options) {
  const { validateEgyptianId: validator } = await loadValidator();
  return validator(nid, options);
}
async function getEgyptianIdGender(nid) {
  const { getEgyptianIdGender: resolver } = await loadValidator();
  return resolver(nid);
}

module.exports = { validateEgyptianId, getEgyptianIdGender };
