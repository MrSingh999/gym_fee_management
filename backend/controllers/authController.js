import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Member from '../models/Member.js';
import sendEmail from '../utils/sendEmail.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// Helper to sign JWT and send cookie
const sendTokenResponse = async (user, statusCode, res) => {
  // Sign tokens using Mongoose model methods
  const accessToken = user.getSignedAccessToken();
  const refreshToken = user.getSignedRefreshToken();

  // Save refresh token to user document in the DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Access token cookie options (15 minutes)
  const accessTokenCookieOptions = {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  };

  // Refresh token cookie options (7 days)
  const refreshTokenCookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth', // restrict scope for extra security
  };

  if (process.env.NODE_ENV === 'production') {
    accessTokenCookieOptions.secure = true;
    refreshTokenCookieOptions.secure = true;
  }

  res
    .status(statusCode)
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
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

// @desc    Authenticate user (admin or member) & set cookies
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

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

  await sendTokenResponse(user, 200, res);
});

// @desc    Log user out & clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'apexfit_access_token_secret_key_12345';
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      
      let user = await Admin.findById(decoded.id);
      if (!user) {
        user = await Member.findById(decoded.id);
      }
      
      if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
    } catch (err) {
      // Ignore token verification errors during logout
    }
  }

  res.cookie('accessToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/api/auth',
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokens = asyncHandler(async (req, res, next) => {
  let refreshToken;
  
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  if (!refreshToken || refreshToken === 'none') {
    throw new ErrorResponse('No refresh token provided. Please log in.', 401);
  }

  try {
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'apexfit_refresh_token_secret_key_67890';
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Find user in DB
    let user = await Admin.findById(decoded.id);
    if (!user) {
      user = await Member.findById(decoded.id);
    }

    if (!user || user.refreshToken !== refreshToken) {
      throw new ErrorResponse('Session is invalid or expired. Please log in again.', 401);
    }

    // Generate a new access token using model method
    const accessToken = user.getSignedAccessToken();

    const accessTokenCookieOptions = {
      expires: new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      sameSite: 'lax',
    };

    if (process.env.NODE_ENV === 'production') {
      accessTokenCookieOptions.secure = true;
    }

    res
      .status(200)
      .cookie('accessToken', accessToken, accessTokenCookieOptions)
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
  } catch (err) {
    // Clear cookies if refresh token is expired or invalid
    res.cookie('accessToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      path: '/api/auth',
    });
    throw new ErrorResponse('Invalid or expired refresh token. Please log in again.', 401);
  }
});

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
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

  await sendTokenResponse(user, 200, res);
});

// @desc    Update logged in user's password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

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
  refreshTokens,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
};
