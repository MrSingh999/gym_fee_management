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
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply route protection to all member API endpoints
router.use(protect);

router.get('/dashboard/stats', getStats);
router.get('/due', getDueMembers);
router.get('/:id/payments', getMemberPayments);
router.get('/', getMembers);
router.post('/', createMember);
router.put('/:id/renew', renewMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
