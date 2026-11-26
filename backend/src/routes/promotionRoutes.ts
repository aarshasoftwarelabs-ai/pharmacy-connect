import { Router } from 'express';
import { PromotionController } from '../controllers/promotionController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public / Store endpoints for fetching active sponsored banners and tracking
router.get('/banners', PromotionController.getActiveBanners);
router.post('/banners/:id/click', PromotionController.trackClick);
router.post('/banners/:id/impression', PromotionController.trackImpression);

// Admin / Management endpoints for managing banners
router.get('/banners/all', authenticate, requireAdmin, PromotionController.getAllBanners);
router.post('/banners', authenticate, requireAdmin, PromotionController.createBanner);
router.patch('/banners/:id', authenticate, requireAdmin, PromotionController.updateBanner);
router.delete('/banners/:id', authenticate, requireAdmin, PromotionController.deleteBanner);

export default router;
