import { Router } from 'express';
import { generateReport, getReports } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/generate', authenticate, generateReport);
router.get('/', authenticate, getReports);

export default router;
