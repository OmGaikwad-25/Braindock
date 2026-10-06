import { Router } from 'express';
import { getDashboardStats, getAnalytics } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);
router.get('/analytics', authenticate, getAnalytics);

export default router;
