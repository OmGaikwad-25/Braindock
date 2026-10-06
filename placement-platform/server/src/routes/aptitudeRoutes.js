import { Router } from 'express';
import { getAptitudeCategories, getQuestionsByTopic } from '../controllers/aptitudeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/categories', authenticate, getAptitudeCategories);
router.get('/questions', authenticate, getQuestionsByTopic);

export default router;
