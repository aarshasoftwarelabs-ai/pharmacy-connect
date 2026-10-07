import { Router } from 'express';
import { WholesaleController } from '../controllers/wholesaleController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

// B2B Clients
router.post('/clients', authMiddleware, requirePermission('WHOLESALE_CREATE'), WholesaleController.addClient);
router.get('/clients/:pharmacyId', authMiddleware, requirePermission('WHOLESALE_VIEW'), WholesaleController.getClients);

// B2B Ledgers
router.get('/clients/:clientId/ledger', authMiddleware, requirePermission('WHOLESALE_VIEW'), WholesaleController.getLedger);
router.post('/clients/:clientId/ledger', authMiddleware, requirePermission('WHOLESALE_EDIT'), WholesaleController.addLedgerEntry);

// B2B Schemes
router.post('/schemes', authMiddleware, requirePermission('WHOLESALE_CREATE'), WholesaleController.addScheme);
router.get('/schemes/:pharmacyId', authMiddleware, requirePermission('WHOLESALE_VIEW'), WholesaleController.getSchemes);

// AI Recommendations
router.get('/clients/:clientId/recommendations', authMiddleware, requirePermission('WHOLESALE_VIEW'), WholesaleController.getRecommendations);

export default router;
