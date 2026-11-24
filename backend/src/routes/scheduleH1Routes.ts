import { Router } from 'express';
import { ScheduleH1Controller } from '../controllers/scheduleH1Controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all Schedule H1 compliance routes
router.use(authenticate);

// GET /api/schedule-h1 - Register entries with search & date filters
router.get('/', ScheduleH1Controller.getRegister);

// GET /api/schedule-h1/stats - Register compliance statistics
router.get('/stats', ScheduleH1Controller.getStats);

// GET /api/schedule-h1/medicines - Available Schedule H1 medicines with batches
router.get('/medicines', ScheduleH1Controller.getH1Medicines);

// POST /api/schedule-h1 - Manual register entry
router.post('/', ScheduleH1Controller.addManualEntry);

export default router;
