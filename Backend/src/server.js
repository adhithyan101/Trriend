const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./database/db');
const healthRouter = require('./routes/health');
const crisisRouter = require('./routes/crises');
const assignmentRouter = require('./routes/assignments');
const resourceRouter = require('./routes/resources');
const memoryRouter = require('./routes/memories');
const volunteerRouter = require('./routes/volunteers');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed origins or any localhost port
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow all during development
      return callback(null, true);
    },
    credentials: true,
  })
);

// JSON body parsing middleware
app.use(express.json());

// Initialize SQLite database
try {
  initDb();
  console.log('SQLite database initialized successfully');
} catch (err) {
  console.error('Database initialization warning:', err.message);
}

// Mount API routes
app.use('/api', healthRouter);
app.use('/api/crises', crisisRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/memories', memoryRouter);
app.use('/api/volunteers', volunteerRouter);

// Fallback explicit mount for health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'co-resolve-backend',
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// Server error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
    });
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`CO-RESOLVE backend running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`DB health endpoint: http://localhost:${PORT}/api/db/health`);
});

module.exports = { app, server };
