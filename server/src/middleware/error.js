const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiResponse.error(res, { message: 'Validation error', errors, statusCode: 400 });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, { message: `Duplicate value for ${field}`, statusCode: 409 });
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, { message: 'Invalid token', statusCode: 401 });
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, { message: 'Token expired', statusCode: 401 });
  }

  return ApiResponse.error(res, {
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode: err.statusCode || 500,
  });
};

module.exports = errorHandler;
