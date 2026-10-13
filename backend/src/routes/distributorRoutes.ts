import { Router } from 'express';
import { DistributorController } from '../controllers/distributorController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, DistributorController.getDistributors);
router.post('/', authenticate, DistributorController.createDistributor);
router.get('/expiring-medicines', authenticate, DistributorController.getExpiringMedicines);
router.get('/returns', authenticate, DistributorController.getReturnChallans);
router.post('/returns', authenticate, DistributorController.createReturnChallan);
router.put('/:id', authenticate, DistributorController.updateDistributor);
router.delete('/:id', authenticate, DistributorController.deleteDistributor);

export default router;
