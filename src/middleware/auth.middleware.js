const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/db');

/**
 * Authentication middleware that verifies JWT and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Bearer token is missing or malformed.'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user no longer exists.'
      });
    }

    // Attach user information to request
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
