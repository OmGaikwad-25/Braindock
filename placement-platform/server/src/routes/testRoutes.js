import { Router } from 'express';
import { getWeeklyTest, submitTest, getTestHistory } from '../controllers/testController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/weekly', authenticate, getWeeklyTest);
router.post('/submit', authenticate, submitTest);
router.get('/history', authenticate, getTestHistory);

export default router;
