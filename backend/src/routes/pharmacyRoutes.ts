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

// Get subscription status & validity
router.get('/:id/subscription-status', PharmacyController.getSubscriptionStatus);
// Get subscription stats
router.get('/stats/subscription', requirePermission('SETTINGS_VIEW'), PharmacyController.getSubscriptionStats);
// Update pharmacy profile by ID
router.put('/:id', requirePermission('PHARMACY_PROFILE_EDIT'), PharmacyController.updatePharmacyProfile);
// Update pharmacy subscription (allow store owner/staff of this pharmacy or admin)
router.post('/:id/subscription', (req, res, next) => {
  const pharmacyId = parseInt(req.params.id, 10);
  const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const role = (user.role || '').toUpperCase();
  if (role === 'OWNER' || role === 'ADMIN' || user.pharmacyId === pharmacyId) {
    return next();
  }
  return requirePermission('SETTINGS_EDIT')(req as any, res, next);
}, PharmacyController.updateSubscription);

// Get subscription payment receipts and history
router.get('/:id/subscription-payments', PharmacyController.getSubscriptionPayments);

export default router;
