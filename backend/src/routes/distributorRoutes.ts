import { Router } from 'express';
import { DistributorController } from '../controllers/distributorController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('SUPPLIERS_VIEW'), DistributorController.getDistributors);
router.post('/', requirePermission('SUPPLIERS_CREATE'), DistributorController.createDistributor);
router.get('/expiring-medicines', requirePermission('INVENTORY_VIEW'), DistributorController.getExpiringMedicines);
router.get('/returns', requirePermission('SUPPLIERS_VIEW'), DistributorController.getReturnChallans);
router.post('/returns', requirePermission('INVENTORY_ADJUST'), DistributorController.createReturnChallan);
router.put('/:id', requirePermission('SUPPLIERS_EDIT'), DistributorController.updateDistributor);
router.delete('/:id', requirePermission('SUPPLIERS_DEACTIVATE'), DistributorController.deleteDistributor);

export default router;
