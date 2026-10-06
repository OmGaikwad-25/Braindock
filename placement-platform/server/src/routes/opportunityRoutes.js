import { Router } from 'express';
import { getOpportunities, createOpportunity } from '../controllers/opportunityController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getOpportunities);
router.post('/', authenticate, createOpportunity);

export default router;
