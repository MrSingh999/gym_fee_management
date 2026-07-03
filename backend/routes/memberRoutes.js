import express from 'express';
import {
  getStats,
  getDueMembers,
  getMembers,
  createMember,
  renewMember,
  updateMember,
  deleteMember,
  getMemberPayments,
} from '../controllers/memberController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Admin-only operations
router.get('/dashboard/stats', admin, getStats);
router.get('/due', admin, getDueMembers);
router.get('/', admin, getMembers);
router.post('/', admin, createMember);
router.put('/:id/renew', admin, renewMember);
router.put('/:id', admin, updateMember);
router.delete('/:id', admin, deleteMember);

// Member or Admin operations
router.get('/:id/payments', getMemberPayments);

export default router;

