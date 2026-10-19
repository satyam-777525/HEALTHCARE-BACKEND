const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  const healthData = {
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  };

  const httpStatus = dbStatus === 'connected' ? 200 : 503;
  return res.status(httpStatus).json(healthData);
});

module.exports = router;
