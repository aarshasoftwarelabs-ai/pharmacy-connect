import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Live Mobile-to-PC Wireless Scanner Sync (strictly authenticated & isolated per store)
router.post('/live-scan', requirePermission('BILLING_CREATE'), BillingController.pushLiveScan);
router.get('/pending-scans/:pharmacyId', requirePermission('BILLING_VIEW'), BillingController.getPendingScans);
router.delete('/pending-scans/:pharmacyId/:scanId', requirePermission('BILLING_CREATE'), BillingController.acknowledgeScan);
router.delete('/pending-scans/:pharmacyId', requirePermission('BILLING_CREATE'), BillingController.clearPendingScans);

// Get billing queue for a pharmacy
router.get('/pharmacy/:pharmacyId/queue', requirePermission('BILLING_VIEW'), BillingController.getBillingQueue);

// Get all bills for a pharmacy
router.get('/pharmacy/:pharmacyId', requirePermission('BILLING_VIEW'), BillingController.getPharmacyBills);
router.get('/', requirePermission('BILLING_VIEW'), BillingController.getPharmacyBills);

// Get a single bill by ID
router.get('/:billId', requirePermission('BILLING_VIEW'), BillingController.getBillById);

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Create a new bill
router.post('/', requirePermission('BILLING_CREATE'), BillingController.createBill);

// Scan Prescription AI
router.post('/scan-prescription', requirePermission('BILLING_CREATE'), upload.single('prescriptionImage'), BillingController.scanPrescription);

// Update delivery assignment & cash collection
router.patch('/:billId/delivery', requirePermission('BILLING_CREATE'), BillingController.updateDelivery);

// Cancel/return bill and restore inventory stock
router.post('/:billId/cancel', requirePermission('BILLING_CREATE'), BillingController.cancelBill);

// Settle unpaid / udhar bill as PAID
router.patch('/:billId/mark-paid', requirePermission('BILLING_CREATE'), BillingController.markBillPaid);

// Resend automated bill invoice via WhatsApp/SMS gateway
router.post('/:billId/send-message', requirePermission('BILLING_CREATE'), BillingController.resendBillMessage);

export default router;
