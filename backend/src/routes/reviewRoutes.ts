import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/public', reviewController.getPublicReviews);
router.get('/my', authenticate, reviewController.getMyReview);
router.post('/', authenticate, reviewController.submitReview);

export default router;
