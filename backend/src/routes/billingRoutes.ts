import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get billing queue for a pharmacy
router.get('/pharmacy/:pharmacyId/queue', BillingController.getBillingQueue);

// Get all bills for a pharmacy
router.get('/pharmacy/:pharmacyId', BillingController.getPharmacyBills);

// Get a single bill by ID
router.get('/:billId', BillingController.getBillById);

// Create a new bill
router.post('/', BillingController.createBill);

export default router;
