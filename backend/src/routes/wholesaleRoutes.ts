import { Router } from 'express';
import { WholesaleController } from '../controllers/wholesaleController';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = Router();

// B2B Clients
router.post('/clients', authMiddleware, WholesaleController.addClient);
router.get('/clients/:pharmacyId', authMiddleware, WholesaleController.getClients);

// B2B Ledgers
router.get('/clients/:clientId/ledger', authMiddleware, WholesaleController.getLedger);
router.post('/clients/:clientId/ledger', authMiddleware, WholesaleController.addLedgerEntry);

// B2B Schemes
router.post('/schemes', authMiddleware, WholesaleController.addScheme);
router.get('/schemes/:pharmacyId', authMiddleware, WholesaleController.getSchemes);

// AI Recommendations
router.get('/clients/:clientId/recommendations', authMiddleware, WholesaleController.getRecommendations);

export default router;
