import { validationResult } from 'express-validator';
import ErrorResponse from '../utils/errorResponse.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return next(new ErrorResponse(errorMsg, 400));
  }
  next();
};
