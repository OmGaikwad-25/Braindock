import { Router } from 'express';
import { getQuestions, submitAssessment, getAssessments } from '../controllers/assessmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/questions', authenticate, getQuestions);
router.post('/submit', authenticate, submitAssessment);
router.get('/', authenticate, getAssessments);

export default router;
