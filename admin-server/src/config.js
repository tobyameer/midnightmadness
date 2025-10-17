const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const CORE_API_BASE_URL =
  (process.env.CORE_API_BASE_URL || '').trim() || 'http://localhost:5001';
const PORT = Number(process.env.PORT || 5003);
const JWT_SECRET = (process.env.ADMIN_JWT_SECRET || ADMIN_API_KEY || '').trim();

if (!ADMIN_API_KEY) {
  throw new Error('ADMIN_API_KEY must be defined for the admin server.');
}

if (!JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET (or ADMIN_API_KEY) must be provided.');
}

module.exports = {
  ADMIN_API_KEY,
  CORE_API_BASE_URL: CORE_API_BASE_URL.replace(/\/$/, ''),
  PORT,
  JWT_SECRET,
};
