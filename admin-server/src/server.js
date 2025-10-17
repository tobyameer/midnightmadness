const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PORT, ADMIN_API_KEY } = require('./config');
const { authenticate, generateToken } = require('./auth');
const ticketsRouter = require('./routes/tickets');

function createServer() {
  const app = express();
  app.set('etag', false);

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
  });
  app.use(morgan('tiny'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.post('/login', (req, res) => {
    const { apiKey } = req.body || {};
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      return res.status(401).json({ message: 'Invalid API key.' });
    }

    const token = generateToken();
    return res.json({ token });
  });

  app.use('/tickets', authenticate, ticketsRouter);

  app.use((err, _req, res, _next) => {
    console.error('Admin server error:', err);
    res.status(500).json({ message: 'Unexpected server error.' });
  });

  return app;
}

function startServer() {
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`Admin server listening on port ${PORT}`);
  });
  return app;
}

module.exports = { createServer, startServer };
