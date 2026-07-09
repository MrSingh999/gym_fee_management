import Workout from '../models/Workout.js';
import WorkoutDay from '../models/WorkoutDay.js';
import MemberWorkout from '../models/MemberWorkout.js';
import Member from '../models/Member.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create a new workout program
// @route   POST /api/workouts
// @access  Private/Admin
const createWorkout = asyncHandler(async (req, res, next) => {
  const { title, description, assignmentType, isActive } = req.body;

  const workout = new Workout({
    title,
    description,
    assignmentType: assignmentType || 'ALL',
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user._id,
  });

  const savedWorkout = await workout.save();
  res.status(201).json(savedWorkout);
});

// @desc    Get all workout programs
// @route   GET /api/workouts
// @access  Private/Admin
const getWorkouts = asyncHandler(async (req, res, next) => {
  const workouts = await Workout.find().sort({ createdAt: -1 });

  // For each workout, count the days and assignments to display on the admin panel
  const workoutsWithCounts = await Promise.all(
    workouts.map(async (workout) => {
      const dayCount = await WorkoutDay.countDocuments({ workoutId: workout._id });
      const assignedCount = await MemberWorkout.countDocuments({ workout: workout._id, isActive: true });
      return {
        ...workout.toObject(),
        dayCount,
        assignedCount,
      };
    })
  );

  res.json(workoutsWithCounts);
});

// @desc    Get a single workout program with its days and assigned members
// @route   GET /api/workouts/:id
// @access  Private/Admin
const getWorkoutById = asyncHandler(async (req, res, next) => {
  const workout = await Workout.findById(req.params.id);

  if (!workout) {
    throw new ErrorResponse('Workout program not found', 404);
  }

  // Fetch days sorted by dayNumber ascending
  const days = await WorkoutDay.find({ workoutId: workout._id }).sort({ dayNumber: 1 });

  // Fetch assigned members
  const assignments = await MemberWorkout.find({ workout: workout._id })
    .populate({
      path: 'member',
      populate: { path: 'plan' }
    });

  res.json({
    ...workout.toObject(),
    days,
    assignments: assignments.map((a) => ({
      assignmentId: a._id,
      member: a.member,
      startDate: a.startDate,
      endDate: a.endDate,
      isActive: a.isActive,
    })),
  });
});

// @desc    Update a workout program
// @route   PUT /api/workouts/:id
// @access  Private/Admin
const updateWorkout = asyncHandler(async (req, res, next) => {
  const { title, description, assignmentType, isActive } = req.body;

  let workout = await Workout.findById(req.params.id);

  if (!workout) {
    throw new ErrorResponse('Workout program not found', 404);
  }

  workout.title = title || workout.title;
  workout.description = description !== undefined ? description : workout.description;
  workout.assignmentType = assignmentType || workout.assignmentType;
  workout.isActive = isActive !== undefined ? isActive : workout.isActive;

  const updatedWorkout = await workout.save();
  res.json(updatedWorkout);
});

// @desc    Delete a workout program and its associated days and assignments
// @route   DELETE /api/workouts/:id
// @access  Private/Admin
const deleteWorkout = asyncHandler(async (req, res, next) => {
  const workout = await Workout.findById(req.params.id);

  if (!workout) {
    throw new ErrorResponse('Workout program not found', 404);
  }

  // Cascade delete workout days
  await WorkoutDay.deleteMany({ workoutId: workout._id });

  // Cascade delete member assignments
  await MemberWorkout.deleteMany({ workout: workout._id });

  // Delete the workout program itself
  await Workout.deleteOne({ _id: workout._id });

  res.json({ message: 'Workout program and associated data deleted successfully' });
});

// @desc    Add a workout day to a program
// @route   POST /api/workouts/:id/days
// @access  Private/Admin
const addWorkoutDay = asyncHandler(async (req, res, next) => {
  const { dayNumber, dayName, title, exercises } = req.body;
  const workoutId = req.params.id;

  const workout = await Workout.findById(workoutId);
  if (!workout) {
    throw new ErrorResponse('Workout program not found', 404);
  }

  // Check if dayNumber is already taken for this workout
  const existingDay = await WorkoutDay.findOne({ workoutId, dayNumber });
  if (existingDay) {
    throw new ErrorResponse(`Day number ${dayNumber} already exists in this workout program`, 400);
  }

  const workoutDay = new WorkoutDay({
    workoutId,
    dayNumber,
    dayName,
    title,
    exercises: exercises || [],
  });

  const savedDay = await workoutDay.save();
  res.status(201).json(savedDay);
});

// @desc    Update a workout day
// @route   PUT /api/workouts/days/:dayId
// @access  Private/Admin
const updateWorkoutDay = asyncHandler(async (req, res, next) => {
  const { dayNumber, dayName, title, exercises } = req.body;
  const { dayId } = req.params;

  let workoutDay = await WorkoutDay.findById(dayId);
  if (!workoutDay) {
    throw new ErrorResponse('Workout day not found', 404);
  }

  // If dayNumber is changing, verify no other day in this program has the new dayNumber
  if (dayNumber !== undefined && dayNumber !== workoutDay.dayNumber) {
    const duplicateDay = await WorkoutDay.findOne({
      workoutId: workoutDay.workoutId,
      dayNumber,
      _id: { $ne: dayId },
    });
    if (duplicateDay) {
      throw new ErrorResponse(`Day number ${dayNumber} already exists in this workout program`, 400);
    }
    workoutDay.dayNumber = dayNumber;
  }

  workoutDay.dayName = dayName || workoutDay.dayName;
  workoutDay.title = title || workoutDay.title;
  if (exercises !== undefined) {
    workoutDay.exercises = exercises;
  }

  const updatedDay = await workoutDay.save();
  res.json(updatedDay);
});

// @desc    Delete a workout day
// @route   DELETE /api/workouts/days/:dayId
// @access  Private/Admin
const deleteWorkoutDay = asyncHandler(async (req, res, next) => {
  const { dayId } = req.params;

  const workoutDay = await WorkoutDay.findById(dayId);
  if (!workoutDay) {
    throw new ErrorResponse('Workout day not found', 404);
  }

  await WorkoutDay.deleteOne({ _id: dayId });
  res.json({ message: 'Workout day deleted successfully' });
});

// @desc    Assign workout program to selected members
// @route   POST /api/workouts/:id/assign
// @access  Private/Admin
const assignMembers = asyncHandler(async (req, res, next) => {
  const workoutId = req.params.id;
  const { memberIds } = req.body; // Can be array of IDs

  const workout = await Workout.findById(workoutId);
  if (!workout) {
    throw new ErrorResponse('Workout program not found', 404);
  }

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw new ErrorResponse('Please provide a valid list of member IDs to assign', 400);
  }

  const assignments = [];
  for (const memberId of memberIds) {
    const member = await Member.findById(memberId);
    if (!member) continue;

    // Check if assignment already exists
    const existing = await MemberWorkout.findOne({ member: memberId, workout: workoutId });
    if (!existing) {
      assignments.push({
        member: memberId,
        workout: workoutId,
        assignedBy: req.user._id,
        isActive: true,
      });
    } else if (!existing.isActive) {
      existing.isActive = true;
      existing.assignedBy = req.user._id;
      await existing.save();
    }
  }

  if (assignments.length > 0) {
    await MemberWorkout.insertMany(assignments);
  }

  res.json({ message: 'Workout program successfully assigned to selected members' });
});

// @desc    Remove workout program assignment from a member
// @route   DELETE /api/workouts/:id/unassign/:memberId
// @access  Private/Admin
const unassignMember = asyncHandler(async (req, res, next) => {
  const { id: workoutId, memberId } = req.params;

  const assignment = await MemberWorkout.findOne({ member: memberId, workout: workoutId });
  if (!assignment) {
    throw new ErrorResponse('Workout assignment not found for this member', 404);
  }

  await MemberWorkout.deleteOne({ _id: assignment._id });
  res.json({ message: 'Workout program assignment successfully removed' });
});

export {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  addWorkoutDay,
  updateWorkoutDay,
  deleteWorkoutDay,
  assignMembers,
  unassignMember,
};
