import express from 'express';
import { body } from 'express-validator';
import {
  loginUser,
  logoutUser,
  refreshTokens,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

router.post(
  '/login',
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
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    validateRequest,
  ],
  forgotPassword
);

router.put(
  '/reset-password/:token',
  [
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

export default router;
