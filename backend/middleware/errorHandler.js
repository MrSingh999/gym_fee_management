import ErrorResponse from '../utils/errorResponse.js';

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  error.statusCode = err.statusCode;

  console.error(`[Error] ${err.stack || err.message}`);

  // Handle Mongoose Validation Error (e.g. missing fields)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Handle Mongoose Cast Error (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    const message = `Resource not found: invalid ID format for field '${err.path}'`;
    error = new ErrorResponse(message, 400);
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized: invalid session token. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Not authorized: session token has expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  // Set response status code (fallback to 500 if not specified on error)
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : error.stack,
  });
};

export default errorHandler;
