import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      default: 'admin',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcryptjs before saving admin
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password in database
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
adminSchema.methods.getResetPasswordToken = function () {
  // Generate random bytes as token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field on admin
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiration (10 minutes from now)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Sign JWT Access Token
adminSchema.methods.getSignedAccessToken = function () {
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'apexfit_access_token_secret_key_12345';
  const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '15m';
  return jwt.sign({ id: this._id }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE,
  });
};

// Sign JWT Refresh Token
adminSchema.methods.getSignedRefreshToken = function () {
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'apexfit_refresh_token_secret_key_67890';
  const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';
  return jwt.sign({ id: this._id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE,
  });
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;

