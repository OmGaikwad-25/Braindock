import { Router } from 'express';
import { getProblems, getProblem, submitSolution, getSubmissions } from '../controllers/codingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getProblems);
router.get('/:id', authenticate, getProblem);
router.post('/:id/submit', authenticate, submitSolution);
router.get('/:id/submissions', authenticate, getSubmissions);

export default router;
