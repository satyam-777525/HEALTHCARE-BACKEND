const { Prisma } = require('@prisma/client');
const env = require('../config/env');

/**
 * 404 handler for unknown routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // If response headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(', ')
          : (err.meta?.target || 'field');
        message = `Unique constraint failed on ${target}. Record already exists.`;
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = err.meta?.cause || 'The requested record was not found.';
        break;
      }
      case 'P2003': {
        statusCode = 400;
        message = 'Foreign key constraint violation. Referenced record does not exist.';
        break;
      }
      case 'P2000': {
        statusCode = 400;
        message = 'The provided value is too long for the database column.';
        break;
      }
      default: {
        statusCode = 400;
        message = `Database operation error [${err.code}].`;
        break;
      }
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided to database query.';
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    // Malformed JSON in request body
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace only in development if status is 500
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
