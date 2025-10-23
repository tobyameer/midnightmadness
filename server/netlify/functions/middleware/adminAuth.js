const jwt = require('jsonwebtoken');

/**
 * Determines whether the incoming request contains valid admin credentials.
 * Accepts either the configured API key in `x-admin-api-key`/`x-admin-token` headers
 * or a Bearer token signed with `ADMIN_JWT_SECRET`.
 * @param {import('express').Request} req
 */
function hasAdminAccess(req) {
  const expectedKey = (process.env.ADMIN_API_KEY || '').trim();
  const configuredJwtSecret = (process.env.ADMIN_JWT_SECRET || '').trim();

  if (expectedKey) {
    const apiKeyHeader = (req.header('x-admin-api-key') || req.header('x-admin-token') || '').trim();
    if (apiKeyHeader && apiKeyHeader === expectedKey) {
      return true;
    }
  }

  const authHeader = req.header('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && configuredJwtSecret) {
      try {
        jwt.verify(token, configuredJwtSecret);
        return true;
      } catch {
        return false;
      }
    }
  }

  return false;
}

/**
 * Guards admin-only routes and responds with HTTP 401 when credentials are missing or invalid.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function adminAuth(req, res, next) {
  if (!hasAdminAccess(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
}

adminAuth.hasAdminAccess = hasAdminAccess;

module.exports = adminAuth;
