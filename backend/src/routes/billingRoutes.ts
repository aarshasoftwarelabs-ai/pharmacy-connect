import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Get billing queue for a pharmacy
router.get('/pharmacy/:pharmacyId/queue', requirePermission('BILLING_VIEW'), BillingController.getBillingQueue);

// Get all bills for a pharmacy
router.get('/pharmacy/:pharmacyId', requirePermission('BILLING_VIEW'), BillingController.getPharmacyBills);

// Get a single bill by ID
router.get('/:billId', requirePermission('BILLING_VIEW'), BillingController.getBillById);

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Create a new bill
router.post('/', requirePermission('BILLING_CREATE'), BillingController.createBill);

// Scan Prescription AI
router.post('/scan-prescription', requirePermission('BILLING_CREATE'), upload.single('prescriptionImage'), BillingController.scanPrescription);

export default router;
