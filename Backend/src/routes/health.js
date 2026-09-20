const express = require('express');
const router = express.Router();
const { getDbHealth } = require('../database/db');

/**
 * Service health check
 * GET /api/health
 */
const serviceHealthHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'co-resolve-backend',
  });
};

/**
 * Database health check
 * GET /api/db/health
 */
const dbHealthHandler = (req, res) => {
  try {
    const health = getDbHealth();
    return res.status(200).json(health);
  } catch (err) {
    console.error('Database health check failed:', err.message);
    return res.status(503).json({
      status: 'error',
      database: 'sqlite',
      message: 'Database service unavailable',
    });
  }
};

// Route definitions
router.get('/health', serviceHealthHandler);
router.get('/db/health', dbHealthHandler);
router.get('/', serviceHealthHandler);

module.exports = router;
