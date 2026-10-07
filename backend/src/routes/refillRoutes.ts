import { Router } from 'express';
import { RefillController } from '../controllers/refillController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Pharmacy PC Refill Routes
router.post('/calculate', requirePermission('CUSTOMERS_VIEW'), RefillController.calculateRefills);
router.get('/', requirePermission('CUSTOMERS_VIEW'), RefillController.getPharmacyReminders);
router.put('/:id/status', requirePermission('CUSTOMERS_EDIT'), RefillController.updateReminderStatus);

export default router;
