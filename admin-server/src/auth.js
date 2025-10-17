const jwt = require('jsonwebtoken');
const { JWT_SECRET, ADMIN_API_KEY } = require('./config');

function generateToken(payload = {}) {
  return jwt.sign(
    {
      role: 'admin',
      ...payload,
    },
    JWT_SECRET,
    {
      expiresIn: '12h',
    },
  );
}

function authenticate(req, res, next) {
  const apiKeyHeader = req.headers['x-admin-api-key'];
  if (apiKeyHeader && apiKeyHeader === ADMIN_API_KEY) {
    req.admin = { role: 'admin', method: 'apiKey' };
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }
}

module.exports = { authenticate, generateToken };
