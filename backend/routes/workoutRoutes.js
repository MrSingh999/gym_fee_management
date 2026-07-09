import express from 'express';
import { body } from 'express-validator';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validator.js';
import {
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
} from '../controllers/workoutController.js';

const router = express.Router();

// Apply protection & admin filters to all routes in this router
router.use(protect);
router.use(admin);

// Workout CRUD
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Workout program title is required').trim(),
    body('assignmentType').optional().isIn(['ALL', 'SELECTED']).withMessage('Assignment type must be ALL or SELECTED'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
    validateRequest,
  ],
  createWorkout
);

router.get('/', getWorkouts);

router.get('/:id', getWorkoutById);

router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Workout program title cannot be empty').trim(),
    body('assignmentType').optional().isIn(['ALL', 'SELECTED']).withMessage('Assignment type must be ALL or SELECTED'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
    validateRequest,
  ],
  updateWorkout
);

router.delete('/:id', deleteWorkout);

// Workout Day CRUD
router.post(
  '/:id/days',
  [
    body('dayNumber').isInt({ min: 1 }).withMessage('Day number must be a positive integer'),
    body('dayName').notEmpty().withMessage('Day name (e.g. Monday) is required').trim(),
    body('title').notEmpty().withMessage('Day focus title is required').trim(),
    body('exercises').optional().isArray().withMessage('Exercises must be provided as an array'),
    body('exercises.*.name').optional().notEmpty().withMessage('Exercise name is required'),
    body('exercises.*.sets').optional().isInt({ min: 1 }).withMessage('Sets must be at least 1'),
    body('exercises.*.reps').optional().notEmpty().withMessage('Reps details are required'),
    validateRequest,
  ],
  addWorkoutDay
);

router.put(
  '/days/:dayId',
  [
    body('dayNumber').optional().isInt({ min: 1 }).withMessage('Day number must be a positive integer'),
    body('dayName').optional().notEmpty().withMessage('Day name cannot be empty').trim(),
    body('title').optional().notEmpty().withMessage('Day focus title cannot be empty').trim(),
    body('exercises').optional().isArray().withMessage('Exercises must be provided as an array'),
    body('exercises.*.name').optional().notEmpty().withMessage('Exercise name is required'),
    body('exercises.*.sets').optional().isInt({ min: 1 }).withMessage('Sets must be at least 1'),
    body('exercises.*.reps').optional().notEmpty().withMessage('Reps details are required'),
    validateRequest,
  ],
  updateWorkoutDay
);

router.delete('/days/:dayId', deleteWorkoutDay);

// Assignments
router.post(
  '/:id/assign',
  [
    body('memberIds').isArray({ min: 1 }).withMessage('Please provide an array of member IDs to assign'),
    body('memberIds.*').isMongoId().withMessage('Invalid member ID format'),
    validateRequest,
  ],
  assignMembers
);

router.delete('/:id/unassign/:memberId', unassignMember);

export default router;
