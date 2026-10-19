const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare Management API is running.',
    version: '1.0.0',
    documentation: '/api/health',
    webTester: '/test'
  });
});

// Interactive Web API Tester (test directly from browser without Postman)
const path = require('path');
app.use('/test', express.static(path.join(__dirname, 'public')));


// API Routes
app.use('/api', apiRoutes);

// 404 Not Found handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
