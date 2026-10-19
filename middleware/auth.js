const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(createHttpError(401, 'Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(createHttpError(401, 'User no longer exists'));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Invalid or expired token'));
    }
    return next(error);
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return next(createHttpError(401, 'Authentication required'));
  }

  if (req.user.role !== role) {
    return next(createHttpError(403, 'Forbidden: insufficient permissions'));
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
};
