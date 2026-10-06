import { Router } from 'express';
import { getRoadmaps, purchaseRoadmap, getMyRoadmap } from '../controllers/roadmapController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getRoadmaps);
router.post('/:id/purchase', authenticate, purchaseRoadmap);
router.get('/my', authenticate, getMyRoadmap);

export default router;
