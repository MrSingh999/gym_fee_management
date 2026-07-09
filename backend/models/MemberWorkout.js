import mongoose from 'mongoose';

const memberWorkoutSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
    },
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      required: [true, 'Workout reference is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Admin reference is required'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate assignments of same workout to same member
memberWorkoutSchema.index({ member: 1, workout: 1 }, { unique: true });

const MemberWorkout = mongoose.model('MemberWorkout', memberWorkoutSchema);

export default MemberWorkout;
