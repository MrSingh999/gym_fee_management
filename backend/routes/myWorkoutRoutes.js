import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyWorkouts, getMyWorkoutById } from '../controllers/myWorkoutController.js';

const router = express.Router();

// Apply protect middleware (only logged in users/members can query their own routines)
router.use(protect);

router.get('/', getMyWorkouts);
router.get('/:id', getMyWorkoutById);

export default router;
