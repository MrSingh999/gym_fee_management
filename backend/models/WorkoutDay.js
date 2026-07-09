import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
  },
  sets: {
    type: Number,
    required: [true, 'Number of sets is required'],
  },
  reps: {
    type: String,
    required: [true, 'Number of reps is required'],
    trim: true,
  },
  duration: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    default: '',
  },
});

const workoutDaySchema = new mongoose.Schema(
  {
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      required: [true, 'Workout ID reference is required'],
    },
    dayNumber: {
      type: Number,
      required: [true, 'Day number is required'],
    },
    dayName: {
      type: String,
      required: [true, 'Day name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Workout day title is required'],
      trim: true,
    },
    exercises: [exerciseSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee unique day number per workout program
workoutDaySchema.index({ workoutId: 1, dayNumber: 1 }, { unique: true });

const WorkoutDay = mongoose.model('WorkoutDay', workoutDaySchema);

export default WorkoutDay;
