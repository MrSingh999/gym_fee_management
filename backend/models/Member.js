import mongoose from 'mongoose';

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
      alias: 'phone',
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
      alias: 'startDate',
    },
    feeEndDate: {
      type: Date,
      required: [true, 'Fee end date is required'],
      alias: 'endDate',
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Inactive'],
      default: 'Active',
    },
    lastPaymentDate: {
      type: Date,
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

memberSchema.virtual('feeAmount').get(function () {
  return this.plan && typeof this.plan === 'object' ? this.plan.price : 0;
});

// Virtual property to dynamically compute status based on end date (for frontend compatibility)
memberSchema.virtual('computedStatus').get(function () {
  if (this.status === 'Inactive' || this.status === 'inactive') {
    return 'inactive';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(this.feeEndDate);
  end.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  if (end < today) {
    return 'overdue';
  } else if (end >= today && end <= sevenDaysFromNow) {
    return 'due';
  } else {
    return 'active';
  }
});

// Ensure virtuals are included when converting to JSON/Object
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

// Pre-save hook to map computed status to DB enum values
memberSchema.pre('save', function (next) {
  if (this.status !== 'Inactive') {
    const comp = this.computedStatus;
    if (comp === 'overdue') {
      this.status = 'Expired';
    } else {
      this.status = 'Active';
    }
  }
  next();
});

const Member = mongoose.model('Member', memberSchema);

export default Member;
