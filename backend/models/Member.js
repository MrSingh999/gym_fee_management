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
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    membershipType: {
      type: String,
      required: [true, 'Membership type is required'],
      enum: ['workout', 'workout + cardio'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    feeAmount: {
      type: Number,
      required: [true, 'Fee amount (price) is required'],
      min: [0, 'Fee cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'due', 'overdue'],
      default: 'active',
    },
    lastPaymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to dynamically compute status based on end date
memberSchema.virtual('computedStatus').get(function () {
  if (this.status === 'inactive') {
    return 'inactive';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(this.endDate);
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

// Pre-save hook to ensure status matches dates if status is not explicitly set to inactive
memberSchema.pre('save', function (next) {
  if (this.status !== 'inactive') {
    this.status = this.computedStatus;
  }
  next();
});

const Member = mongoose.model('Member', memberSchema);

export default Member;
