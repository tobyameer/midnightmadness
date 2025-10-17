// Cached Mongo connection for Netlify Functions
const mongoose = require("mongoose");

let connPromise = null;

async function connect() {
  if (connPromise) return connPromise;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  connPromise = mongoose.connect(uri, {
    // dbName can be embedded in your URI; if not, set it here:
    // dbName: "midnight-madness",
  });
  await connPromise;
  return mongoose;
}

module.exports = { connect, mongoose };
