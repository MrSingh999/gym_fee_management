import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import Admin from '../models/Admin.js';
import Member from '../models/Member.js';
import sendEmail from '../utils/sendEmail.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import cloudinary from '../config/cloudinary.js';

// Helper to sign JWT and send cookie
const sendTokenResponse = async (user, statusCode, res) => {
  // Sign tokens using Mongoose model methods
  const accessToken = user.getSignedAccessToken();
  const refreshToken = user.getSignedRefreshToken();

  // Save refresh token to user's refreshTokens array (capped at 5 to avoid database array bloating)
  if (!user.refreshTokens) {
    user.refreshTokens = [];
  }
  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens.shift();
  }
  
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
    accessTokenCookieOptions.sameSite = 'lax'; // Tightened cookie security for same-origin proxy
    refreshTokenCookieOptions.secure = true;
    refreshTokenCookieOptions.sameSite = 'lax';
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
        profilePicture: user.profilePicture || '',
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
  let refreshToken;
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  if (refreshToken && refreshToken !== 'none') {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      let user = await Admin.findById(decoded.id);
      if (!user) {
        user = await Member.findById(decoded.id);
      }
      
      if (user && user.refreshTokens) {
        // Remove the specific refresh token from active list
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    } catch (err) {
      // Ignore token verification errors during logout
    }
  }

  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };

  const refreshCookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/api/auth',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'lax';
    refreshCookieOptions.secure = true;
    refreshCookieOptions.sameSite = 'lax';
  }

  res.cookie('accessToken', 'none', cookieOptions);
  res.cookie('refreshToken', 'none', refreshCookieOptions);

  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokens = asyncHandler(async (req, res, next) => {
  let oldRefreshToken;
  
  if (req.cookies && req.cookies.refreshToken) {
    oldRefreshToken = req.cookies.refreshToken;
  }

  if (!oldRefreshToken || oldRefreshToken === 'none') {
    throw new ErrorResponse('No refresh token provided. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find user in DB
    let user = await Admin.findById(decoded.id);
    if (!user) {
      user = await Member.findById(decoded.id);
    }

    // Reuse detection / validation
    if (!user || !user.refreshTokens || !user.refreshTokens.includes(oldRefreshToken)) {
      if (user) {
        // Potential token theft: invalidate all sessions as precaution
        user.refreshTokens = [];
        await user.save({ validateBeforeSave: false });
      }
      throw new ErrorResponse('Session is invalid or expired. Please log in again.', 401);
    }

    // Check token version matching
    if (decoded.tokenVersion !== user.tokenVersion) {
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      throw new ErrorResponse('Session has expired due to credentials change. Please log in again.', 401);
    }

    // Rotate refresh token
    const newRefreshToken = user.getSignedRefreshToken();
    const newAccessToken = user.getSignedAccessToken();

    // Swap old refresh token for the new rotated token
    user.refreshTokens = user.refreshTokens.filter((token) => token !== oldRefreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    const accessTokenCookieOptions = {
      expires: new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      sameSite: 'lax',
    };

    const refreshTokenCookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/auth',
    };

    if (process.env.NODE_ENV === 'production') {
      accessTokenCookieOptions.secure = true;
      accessTokenCookieOptions.sameSite = 'lax';
      refreshTokenCookieOptions.secure = true;
      refreshTokenCookieOptions.sameSite = 'lax';
    }

    res
      .status(200)
      .cookie('accessToken', newAccessToken, accessTokenCookieOptions)
      .cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions)
      .json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role || 'member',
          profilePicture: user.profilePicture || '',
        },
      });
  } catch (err) {
    // Clear cookies if refresh token is expired or invalid
    const cookieOptions = {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    };

    const refreshCookieOptions = {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      path: '/api/auth',
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'lax';
      refreshCookieOptions.secure = true;
      refreshCookieOptions.sameSite = 'lax';
    }

    res.cookie('accessToken', 'none', cookieOptions);
    res.cookie('refreshToken', 'none', refreshCookieOptions);
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

  let user = await Admin.findOne({ email: email.toLowerCase() });
  let role = 'admin';
  if (!user) {
    user = await Member.findOne({ email: email.toLowerCase() });
    role = 'member';
  }

  if (!user) {
    throw new ErrorResponse('No account found with that email address', 404);
  }

  // Generate 6-digit OTP
  const resetToken = user.getResetPasswordToken();

  // Save token to database user record
  await user.save({ validateBeforeSave: false });

  const message = `Your HEAVEN'S ARENA ${role === 'admin' ? 'Admin' : 'Member'} dashboard password reset OTP code is: ${resetToken}\n\nThis OTP code will expire in 10 minutes. If you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
      <h2 style="color: #ff5722; text-align: center;">HEAVEN'S ARENA</h2>
      <p>You requested a password reset for your gym membership dashboard ${role === 'admin' ? 'admin' : 'member'} account.</p>
      <p>Use the following 6-digit One-Time Password (OTP) to reset your password:</p>
      <div style="background-color: #f4f4f5; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; border-radius: 6px; margin: 20px 0; color: #09090b;">
        ${resetToken}
      </div>
      <p style="color: #71717a; font-size: 13px;">This OTP code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'HEAVEN\'S ARENA Team - Password Reset OTP Code',
      message,
      html,
    });

    res.json({ success: true, message: 'Password reset OTP code sent to your email.' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse('Reset OTP email could not be sent.', 500);
  }
});

// @desc    Update password with reset token
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    throw new ErrorResponse('Please provide email, OTP code, and new password', 400);
  }

  // Hash the input OTP code to match stored version
  const hashedToken = crypto
    .createHash('sha256')
    .update(otp.trim())
    .digest('hex');

  // Find user in Admin or Member with matching email, token and unexpired timer
  let user = await Admin.findOne({
    email: email.toLowerCase(),
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    user = await Member.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }

  if (!user) {
    throw new ErrorResponse('Invalid or expired OTP code.', 400);
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

  // Set new password (hashed automatically on save) and invalidate active sessions
  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.refreshTokens = [];
  await user.save();

  // Clear client cookies to enforce re-authentication
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };

  const refreshCookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/api/auth',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'lax';
    refreshCookieOptions.secure = true;
    refreshCookieOptions.sameSite = 'lax';
  }

  res.cookie('accessToken', 'none', cookieOptions);
  res.cookie('refreshToken', 'none', refreshCookieOptions);

  res.json({
    success: true,
    message: 'Password updated successfully. Please log in again on all devices.'
  });
});

// @desc    Upload profile picture
// @route   PUT /api/auth/profile-picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ErrorResponse('Please upload an image file.', 400);
  }

  const localFilePath = req.file.path;

  try {
    // Upload local file to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'gym-dashboard/profile-pictures',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ],
    });

    // Remove local file
    fs.unlink(localFilePath, (err) => {
      if (err) console.error('Failed to delete temporary local upload:', err);
    });

    const imageUrl = result.secure_url;

    // Update user in Database depending on role
    let updatedUser;
    if (req.user.role === 'admin') {
      updatedUser = await Admin.findByIdAndUpdate(
        req.user._id,
        { profilePicture: imageUrl },
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      updatedUser = await Member.findByIdAndUpdate(
        req.user._id,
        { profilePicture: imageUrl },
        { new: true, runValidators: true }
      ).populate('plan').select('-password');
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: imageUrl,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role || 'member',
        profilePicture: updatedUser.profilePicture || '',
      }
    });
  } catch (err) {
    // Cleanup local file on error
    fs.unlink(localFilePath, (unlinkErr) => {
      if (unlinkErr) console.error('Failed to clean up temporary local file after upload error:', unlinkErr);
    });
    throw new ErrorResponse(`Upload failed: ${err.message}`, 500);
  }
});

// @desc    Update admin profile details
// @route   PUT /api/auth/profile
// @access  Private (Admin Only)
const updateAdminProfile = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  if (req.user.role !== 'admin') {
    throw new ErrorResponse('Not authorized as an admin. Access denied.', 403);
  }

  const adminUser = await Admin.findById(req.user._id);
  if (!adminUser) {
    throw new ErrorResponse('Admin profile not found.', 404);
  }

  if (name) {
    adminUser.name = name;
  }

  if (email && email.toLowerCase() !== adminUser.email.toLowerCase()) {
    const cleanEmail = email.toLowerCase();
    
    // Check if email exists in Admin or Member
    const emailExistsAdmin = await Admin.findOne({ email: cleanEmail });
    if (emailExistsAdmin) {
      throw new ErrorResponse('Email address is already in use by another admin.', 400);
    }
    const emailExistsMember = await Member.findOne({ email: cleanEmail });
    if (emailExistsMember) {
      throw new ErrorResponse('Email address is already in use by a member.', 400);
    }

    adminUser.email = cleanEmail;
    
    // Force session refresh across devices on email change
    adminUser.tokenVersion = (adminUser.tokenVersion || 0) + 1;
    adminUser.refreshTokens = [];
  }

  await adminUser.save();
  await sendTokenResponse(adminUser, 200, res);
});

// @desc    Logout from all devices (invalidate all tokens)
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAllDevices = asyncHandler(async (req, res, next) => {
  let user;
  if (req.user.role === 'admin') {
    user = await Admin.findById(req.user._id);
  } else {
    user = await Member.findById(req.user._id);
  }

  if (!user) {
    throw new ErrorResponse('User record not found.', 404);
  }

  // Increment version to invalidate existing access tokens, and clear refresh tokens
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.refreshTokens = [];
  await user.save();

  // Clear client cookies
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };

  const refreshCookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/api/auth',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'lax';
    refreshCookieOptions.secure = true;
    refreshCookieOptions.sameSite = 'lax';
  }

  res.cookie('accessToken', 'none', cookieOptions);
  res.cookie('refreshToken', 'none', refreshCookieOptions);

  res.json({
    success: true,
    message: 'Successfully logged out from all devices.'
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
  uploadProfilePicture,
  updateAdminProfile,
  logoutAllDevices,
};
