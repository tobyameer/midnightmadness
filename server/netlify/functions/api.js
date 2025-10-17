// netlify/functions/api.js
const serverless = require("serverless-http");
// IMPORTANT: require the file that exports your Express app (no app.listen!)
const app = require("../../server/app"); // <- we'll create server/app.js next
module.exports.handler = serverless(app);
