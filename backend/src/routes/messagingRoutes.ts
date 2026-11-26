import { Router } from 'express';
import { MessagingController } from '../controllers/messagingController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Settings
router.get('/settings', requirePermission('SETTINGS_VIEW'), MessagingController.getSettings);
router.put('/settings', requirePermission('SETTINGS_EDIT'), MessagingController.updateSettings);

// Test gateway sending
router.post('/test', requirePermission('SETTINGS_EDIT'), MessagingController.sendTestMessage);

// Delivery logs
router.get('/logs', requirePermission('SETTINGS_VIEW'), MessagingController.getLogs);

// Resend bill invoice
router.post('/resend-bill/:billId', requirePermission('BILLING_CREATE'), MessagingController.resendBill);

export default router;
