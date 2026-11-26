import { Router } from 'express';
import { ScheduleH1Controller } from '../controllers/scheduleH1Controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

// Protect all Schedule H1 compliance routes
router.use(authenticate);

// GET /api/schedule-h1 - Register entries with search & date filters
router.get('/', requirePermission('INVENTORY_VIEW'), ScheduleH1Controller.getRegister);

// GET /api/schedule-h1/stats - Register compliance statistics
router.get('/stats', requirePermission('INVENTORY_VIEW'), ScheduleH1Controller.getStats);

// GET /api/schedule-h1/medicines - Available Schedule H1 medicines with batches
router.get('/medicines', requirePermission('INVENTORY_VIEW'), ScheduleH1Controller.getH1Medicines);

// POST /api/schedule-h1 - Manual register entry
router.post('/', requirePermission('BILLING_CREATE'), ScheduleH1Controller.addManualEntry);

export default router;
