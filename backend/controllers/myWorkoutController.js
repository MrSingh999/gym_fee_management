import Workout from '../models/Workout.js';
import WorkoutDay from '../models/WorkoutDay.js';
import MemberWorkout from '../models/MemberWorkout.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get all workout programs assigned to the logged-in member
// @route   GET /api/my-workouts
// @access  Private
const getMyWorkouts = asyncHandler(async (req, res, next) => {
  const memberId = req.user._id;

  // 1. Get all public workouts
  const publicWorkouts = await Workout.find({
    isActive: true,
    assignmentType: 'ALL',
  });

  // 2. Get all custom workout assignments
  const personalAssignments = await MemberWorkout.find({
    member: memberId,
    isActive: true,
  }).populate('workout');

  // Filter out any assignments where the workout is deactivated/missing
  const personalWorkouts = personalAssignments
    .filter((a) => a.workout && a.workout.isActive)
    .map((a) => a.workout);

  // 3. Combine and de-duplicate
  const combined = [...publicWorkouts, ...personalWorkouts];
  const uniqueWorkouts = [];
  const seenIds = new Set();

  for (const workout of combined) {
    const idStr = workout._id.toString();
    if (!seenIds.has(idStr)) {
      seenIds.add(idStr);
      uniqueWorkouts.push(workout);
    }
  }

  // 4. Attach day counts for rendering
  const workoutsWithDayCount = await Promise.all(
    uniqueWorkouts.map(async (workout) => {
      const dayCount = await WorkoutDay.countDocuments({ workoutId: workout._id });
      return {
        ...workout.toObject(),
        dayCount,
      };
    })
  );

  res.json(workoutsWithDayCount);
});

// @desc    Get workout details (including day-wise routines and exercises) for the member
// @route   GET /api/my-workouts/:id
// @access  Private
const getMyWorkoutById = asyncHandler(async (req, res, next) => {
  const workoutId = req.params.id;
  const memberId = req.user._id;

  const workout = await Workout.findById(workoutId);

  if (!workout || !workout.isActive) {
    throw new ErrorResponse('Workout program not found or is currently inactive', 404);
  }

  // Verify authorization: either workout is ALL (public) or member is assigned to it
  if (workout.assignmentType === 'SELECTED') {
    const assignment = await MemberWorkout.findOne({
      member: memberId,
      workout: workoutId,
      isActive: true,
    });

    if (!assignment) {
      throw new ErrorResponse('Access denied. You are not assigned to this workout program.', 403);
    }
  }

  // Retrieve days sorted by dayNumber ascending
  const days = await WorkoutDay.find({ workoutId }).sort({ dayNumber: 1 });

  res.json({
    ...workout.toObject(),
    days,
  });
});

export { getMyWorkouts, getMyWorkoutById };
