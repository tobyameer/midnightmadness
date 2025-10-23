const mongoose = require("mongoose");

let cached = null;

function redact(uri) {
  if (!uri) return "";
  return uri
    .replace(/\/\/([^:@/]+):([^@/]+)@/, "//<redacted>:<redacted>@")
    .replace(/\?(.*)$/, "");
}

async function connectToDatabase() {
  if (cached && mongoose.connection.readyState === 1) return cached;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  const isSrv = uri.startsWith("mongodb+srv://");
  const opts = {
    tls: true,
    serverSelectionTimeoutMS: 12000,
    family: 4,
    retryWrites: true,
    appName: process.env.MONGODB_APPNAME || "NetlifyFunction",
  };

  if (!cached) {
    console.log("🟡 Mongo connecting", {
      scheme: isSrv ? "mongodb+srv" : "mongodb",
      isSrv,
      node: process.version,
      mongoose: mongoose.version,
      uriRedacted: redact(uri),
    });
  }

  await mongoose.connect(uri, opts);
  cached = mongoose.connection;

  console.log("✅ Mongo connected", { state: mongoose.connection.readyState });
  return cached;
}

module.exports = { connectToDatabase, redact };
