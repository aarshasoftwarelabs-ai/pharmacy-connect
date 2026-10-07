import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescriptionController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Customer Routes (Can upload, get their own)
// In a real app, customer routes would have separate authentication/authorization logic 
// to ensure a user only accesses their own prescriptions. Here we trust the middleware for now.
router.post('/', PrescriptionController.upload);
router.get('/customer/:customerId', PrescriptionController.getCustomerPrescriptions);

// Pharmacy PC Routes
router.get('/', requirePermission('PRESCRIPTIONS_VIEW'), PrescriptionController.getPharmacyPrescriptions);
router.put('/:id/status', requirePermission('PRESCRIPTIONS_MANAGE'), PrescriptionController.updateStatus);

export default router;
