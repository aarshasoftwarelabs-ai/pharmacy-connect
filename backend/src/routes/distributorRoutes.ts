import { Router } from 'express';
import { DistributorController } from '../controllers/distributorController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, DistributorController.getDistributors);
router.post('/', authenticate, DistributorController.createDistributor);
router.put('/:id', authenticate, DistributorController.updateDistributor);
router.delete('/:id', authenticate, DistributorController.deleteDistributor);

export default router;
