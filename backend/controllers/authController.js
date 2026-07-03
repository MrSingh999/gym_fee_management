import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Member from '../models/Member.js';
import sendEmail from '../utils/sendEmail.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// Helper to sign JWT and send cookie
const sendTokenResponse = (user, statusCode, res) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'apexfit_jwt_secret_key_12345';
  const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
  
  // Sign token
  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    ),
    httpOnly: true,
    sameSite: 'lax', // standard sameSite
  };

  // Secure cookie in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role || 'member',
      },
    });
};

// @desc    Authenticate user (admin or member) & set cookie
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body; // email can be email or phone

  // Validate email & password
  if (!email || !password) {
    throw new ErrorResponse('Please provide email/phone and password', 400);
  }

  let user;

  // 1. Check Admin collection first (Admins)
  if (email.includes('@')) {
    user = await Admin.findOne({ email: email.toLowerCase() });
  }

  if (user) {
    // Validate Admin password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ErrorResponse('Invalid credentials', 401);
    }
  } else {
    // 2. Check Member collection (email or mobile)
    const query = email.includes('@') 
      ? { email: email.toLowerCase() } 
      : { mobile: email };
    
    user = await Member.findOne(query).populate('plan');
    if (!user) {
      throw new ErrorResponse('Invalid credentials', 401);
    }

    // Validate Member password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ErrorResponse('Invalid credentials', 401);
    }
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // expire in 10s
    httpOnly: true,
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  // req.user was populated by protect middleware
  res.json({
    success: true,
    user: req.user,
  });
});

// @desc    Trigger Forgot Password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new ErrorResponse('Please enter an email address', 400);
  }

  const user = await Admin.findOne({ email });
  if (!user) {
    throw new ErrorResponse('No admin account found with that email address', 404);
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();

  // Save token to database user record
  await user.save({ validateBeforeSave: false });

  // Create reset URL (matches react frontend routing query)
  const resetUrl = `${req.protocol}://${req.get('host')}/?resetToken=${resetToken}`;
  
  // In dev env, frontend runs on 5173 but backend runs on 5000. So adjust link port to frontend dev port 5173
  const frontendUrl = resetUrl.replace(':5000', ':5173');

  const message = `You are receiving this email because a password reset request was made for your APEX FITNESS Admin dashboard account.\n\nPlease proceed to this link to reset your password:\n\n${frontendUrl}\n\nThis reset link will expire in 10 minutes. If you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'APEX FITNESS Dashboard - Password Reset Link',
      message,
      html: `
        <h3>APEX FITNESS Admin Console</h3>
        <p>You requested a password reset for your gym membership dashboard account.</p>
        <p>Please click the button below to reset your password within 10 minutes:</p>
        <a href="${frontendUrl}" style="background-color: #ff5722; color: white; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        <br /><br />
        <p>If you cannot click the button, copy and paste this link in your browser:</p>
        <p>${frontendUrl}</p>
      `,
    });

    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse('Reset email could not be sent. Please check system SMTP configs.', 500);
  }
});

// @desc    Update password with reset token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ErrorResponse('Please provide a new password', 400);
  }

  // Hash the input token to match stored version
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find admin with matching token and unexpired timer
  const user = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ErrorResponse('Invalid or expired reset token.', 400);
  }

  // Set new password (will be hashed automatically by user Schema save hook)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Update logged in user's password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ErrorResponse('Please provide current password and new password', 400);
  }

  if (newPassword.length < 6) {
    throw new ErrorResponse('New password must be at least 6 characters long', 400);
  }

  let user;
  if (req.user.role === 'admin') {
    user = await Admin.findById(req.user._id);
  } else {
    user = await Member.findById(req.user._id);
  }

  if (!user) {
    throw new ErrorResponse('User session no longer exists.', 401);
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ErrorResponse('Incorrect current password', 401);
  }

  // Set new password (hashed automatically on save)
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

// Grouped exports at the bottom
export {
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
};

