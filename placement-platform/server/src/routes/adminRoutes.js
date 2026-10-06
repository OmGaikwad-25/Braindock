import { Router } from 'express';
import { getAdminStats, getAllUsers, deleteUser, updateUserRole, createCodingProblem, updateCodingProblem, deleteCodingProblem, getAllCodingProblems, createMCQ, updateMCQ, deleteMCQ, getAllMCQs } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, isAdmin, getAdminStats);
router.get('/users', authenticate, isAdmin, getAllUsers);
router.delete('/users/:id', authenticate, isAdmin, deleteUser);
router.put('/users/:id/role', authenticate, isAdmin, updateUserRole);

// Coding Problems
router.get('/problems', authenticate, isAdmin, getAllCodingProblems);
router.post('/problems', authenticate, isAdmin, createCodingProblem);
router.put('/problems/:id', authenticate, isAdmin, updateCodingProblem);
router.delete('/problems/:id', authenticate, isAdmin, deleteCodingProblem);

// MCQ Questions
router.get('/mcqs', authenticate, isAdmin, getAllMCQs);
router.post('/mcqs', authenticate, isAdmin, createMCQ);
router.put('/mcqs/:id', authenticate, isAdmin, updateMCQ);
router.delete('/mcqs/:id', authenticate, isAdmin, deleteMCQ);

export default router;
