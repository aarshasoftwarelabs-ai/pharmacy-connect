import { Router } from 'express';
import { MessagingController } from '../controllers/messagingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Settings
router.get('/settings', MessagingController.getSettings);
router.put('/settings', MessagingController.updateSettings);

// Test gateway sending
router.post('/test', MessagingController.sendTestMessage);

// Delivery logs
router.get('/logs', MessagingController.getLogs);

// Resend bill invoice
router.post('/resend-bill/:billId', MessagingController.resendBill);

export default router;
