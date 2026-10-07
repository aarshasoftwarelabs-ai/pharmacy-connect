import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacyController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

// Get all pharmacies (publicly visible for users)
router.get('/', PharmacyController.getAllPharmacies);

// Get pharmacy profile by ID (publicly visible for public inventory pages, etc.)
router.get('/:id', PharmacyController.getPharmacyProfile);

// Secure all other routes
router.use(authenticate);

// Get subscription stats
router.get('/stats/subscription', requirePermission('SETTINGS_VIEW'), PharmacyController.getSubscriptionStats);
// Update pharmacy profile by ID
router.put('/:id', requirePermission('PHARMACY_PROFILE_EDIT'), PharmacyController.updatePharmacyProfile);
// Update pharmacy subscription
router.post('/:id/subscription', requirePermission('SETTINGS_EDIT'), PharmacyController.updateSubscription);

export default router;
