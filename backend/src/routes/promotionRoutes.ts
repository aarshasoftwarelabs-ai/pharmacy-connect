import { Router } from 'express';
import { PromotionController } from '../controllers/promotionController';

const router = Router();

// Public / Store endpoints for fetching active sponsored banners and tracking
router.get('/banners', PromotionController.getActiveBanners);
router.post('/banners/:id/click', PromotionController.trackClick);
router.post('/banners/:id/impression', PromotionController.trackImpression);

// Admin / Management endpoints for managing banners
router.get('/banners/all', PromotionController.getAllBanners);
router.post('/banners', PromotionController.createBanner);
router.patch('/banners/:id', PromotionController.updateBanner);
router.delete('/banners/:id', PromotionController.deleteBanner);

export default router;
