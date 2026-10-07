import { Router } from 'express';
import { BatchController } from '../controllers/batchController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('INVENTORY_VIEW'), BatchController.getBatches);
router.get('/expiring', requirePermission('INVENTORY_VIEW'), BatchController.getExpiringBatches);
router.get('/expired', requirePermission('INVENTORY_VIEW'), BatchController.getExpiredBatches);
router.get('/:id', requirePermission('INVENTORY_VIEW'), BatchController.getBatchById);

export default router;
