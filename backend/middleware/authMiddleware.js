import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Member from '../models/Member.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from './asyncHandler.js';

// Protect routes middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Retrieve token from cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    throw new ErrorResponse('Not authorized to access this resource. Please log in first.', 401);
  }

  // Verify token (failures automatically captured by asyncHandler -> errorHandler)
  const JWT_SECRET = process.env.JWT_SECRET || 'apexfit_jwt_secret_key_12345';
  const decoded = jwt.verify(token, JWT_SECRET);

  // Get user from database, excluding password field
  let currentUser = await Admin.findById(decoded.id).select('-password');
  if (!currentUser) {
    currentUser = await Member.findById(decoded.id).populate('plan').select('-password');
  }

  if (!currentUser) {
    throw new ErrorResponse('User session no longer exists. Please log in again.', 401);
  }

  req.user = currentUser;
  next();
});

// Admin-only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    throw new ErrorResponse('Not authorized as an admin. Access denied.', 403);
  }
};

// Grouped exports at the bottom
export { protect, admin };

