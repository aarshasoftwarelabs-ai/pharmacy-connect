import { Router } from 'express';
import { BatchController } from '../controllers/batchController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('INVENTORY_VIEW'), BatchController.getBatches);
router.get('/expiring', requirePermission('INVENTORY_VIEW'), BatchController.getExpiringBatches);
router.get('/expired', requirePermission('INVENTORY_VIEW'), BatchController.getExpiredBatches);
router.get('/medicine/:medicineId', requirePermission('INVENTORY_VIEW'), BatchController.getBatchesByMedicine);
router.post('/', requirePermission('MEDICINES_CREATE'), BatchController.createBatch);
router.delete('/:id', requirePermission('MEDICINES_DELETE'), BatchController.deleteBatch);
router.post('/initialize-missing', requirePermission('MEDICINES_EDIT'), BatchController.initializeMissingBatches);
router.get('/:id', requirePermission('INVENTORY_VIEW'), BatchController.getBatchById);

export default router;
