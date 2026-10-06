import { Router } from 'express';
import { startInterview, answerQuestion, endInterview, getInterviewHistory } from '../controllers/interviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/start', authenticate, startInterview);
router.post('/:id/answer', authenticate, answerQuestion);
router.post('/:id/end', authenticate, endInterview);
router.get('/history', authenticate, getInterviewHistory);

export default router;
