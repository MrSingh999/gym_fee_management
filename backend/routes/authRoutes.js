import express from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import {
  loginUser,
  logoutUser,
  refreshTokens,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  uploadProfilePicture,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validator.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                    // 10 attempts per window
  message: { message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: 'Too many password reset requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Please provide email or phone number'),
    body('password').notEmpty().withMessage('Please provide a password'),
    validateRequest,
  ],
  loginUser
);

router.post('/logout', logoutUser);
router.post('/refresh', refreshTokens);

router.post(
  '/forgot-password',
  forgotLimiter,
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    validateRequest,
  ],
  forgotPassword
);

router.put(
  '/reset-password',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validateRequest,
  ],
  resetPassword
);

router.get('/me', protect, getMe);

router.put(
  '/update-password',
  [
    protect,
    body('currentPassword').notEmpty().withMessage('Please provide current password'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validateRequest,
  ],
  updatePassword
);

router.put('/profile-picture', protect, upload.single('image'), uploadProfilePicture);

export default router;
