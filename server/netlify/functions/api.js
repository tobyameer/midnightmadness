const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const app = express();

// Trust proxy
app.set('trust proxy', 1);
app.set('etag', false);

// Security
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
  'https://clearvisioncai.netlify.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with caching
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠ MONGO_URI not defined');
    return null;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected');
    return cachedDb;
  } catch (error) {
    console.warn(`⚠ MongoDB connection failed: ${error.message}`);
    return null;
  }
}

// Import routes
const ticketRoutes = require('../../routes/tickets');
const publicRoutes = require('../../routes/public');
const adminVerifyRoutes = require('../../routes/adminVerify');

// Health check - must be before other routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Apply routes - they already have /api prefix in them
app.use(publicRoutes);
app.use('/api/admin', adminVerifyRoutes);
app.use('/api/tickets', ticketRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Unexpected server error.', details: err.message });
});

// Export handler
const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Connect to DB before handling request
  await connectToDatabase();
  
  return handler(event, context);
};
