import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    mobile: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required'],
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    feeStartDate: {
      type: Date,
      required: [true, 'Fee start date is required'],
    },
    feeEndDate: {
      type: Date,
      required: [true, 'Fee end date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Inactive'],
      default: 'Active',
    },
    lastPaymentDate: {
      type: Date,
    },
    password: {
      type: String,
      default: 'member123',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual properties to extract plan details for backward compatibility
memberSchema.virtual('membershipType').get(function () {
  return this.plan && typeof this.plan === 'object' ? this.plan.name : '';
});

memberSchema.virtual('startDate')
  .get(function () {
    return this.feeStartDate;
  })
  .set(function (val) {
    this.feeStartDate = val;
  });

memberSchema.virtual('endDate')
  .get(function () {
    return this.feeEndDate;
  })
  .set(function (val) {
    this.feeEndDate = val;
  });

memberSchema.virtual('phone')
  .get(function () {
    return this.mobile;
  })
  .set(function (val) {
    this.mobile = val;
  });

memberSchema.virtual('feeAmount').get(function () {
  return this.plan && typeof this.plan === 'object' ? this.plan.price : 0;
});

// Virtual property to dynamically compute status based on end date (for frontend compatibility)
memberSchema.virtual('computedStatus').get(function () {
  if (this.status === 'Inactive' || this.status === 'inactive') {
    return 'inactive';
  }

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  // Start of today in IST
  const todayIST = new Date(now.getTime() + istOffset);
  todayIST.setUTCHours(0, 0, 0, 0);

  // End date in IST
  const endDate = new Date(new Date(this.feeEndDate).getTime() + istOffset);
  endDate.setUTCHours(0, 0, 0, 0);

  // 7 days boundary in IST
  const sevenDaysFromNowIST = new Date(todayIST.getTime() + 7 * 24 * 60 * 60 * 1000);
  sevenDaysFromNowIST.setUTCHours(0, 0, 0, 0);

  if (endDate < todayIST) {
    return 'overdue';
  } else if (endDate >= todayIST && endDate <= sevenDaysFromNowIST) {
    return 'due';
  } else {
    return 'active';
  }
});

// Virtual property to identify as 'member' role
memberSchema.virtual('role').get(function () {
  return 'member';
});

// Ensure virtuals are included when converting to JSON/Object
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

// Pre-save hook to map computed status to DB enum values & hash password
memberSchema.pre('save', async function (next) {
  if (this.status && this.status.toLowerCase() !== 'inactive') {
    const comp = this.computedStatus;
    if (comp === 'overdue') {
      this.status = 'Expired';
    } else {
      this.status = 'Active';
    }
  } else {
    this.status = 'Inactive';
  }

  // Hash password if modified
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

// Method to verify passwords
memberSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return enteredPassword === this.password;
};

// Sign JWT Access Token
memberSchema.methods.getSignedAccessToken = function () {
  return jwt.sign(
    { id: this._id, tokenVersion: this.tokenVersion || 0 },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    }
  );
};

// Sign JWT Refresh Token
memberSchema.methods.getSignedRefreshToken = function () {
  return jwt.sign(
    { id: this._id, tokenVersion: this.tokenVersion || 0 },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    }
  );
};

// Generate and hash password reset token
memberSchema.methods.getResetPasswordToken = function () {
  // Generate random 6-digit OTP
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash token and set to resetPasswordToken field on member
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiration (10 minutes from now)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const Member = mongoose.model('Member', memberSchema);

export default Member;
