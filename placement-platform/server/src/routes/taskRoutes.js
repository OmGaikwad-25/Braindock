import { Router } from 'express';
import { getDailyTasks, completeTask, getTaskHistory, getStudyPlan } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/daily', authenticate, getDailyTasks);
router.put('/:id/complete', authenticate, completeTask);
router.get('/history', authenticate, getTaskHistory);
router.get('/study-plan', authenticate, getStudyPlan);

export default router;
