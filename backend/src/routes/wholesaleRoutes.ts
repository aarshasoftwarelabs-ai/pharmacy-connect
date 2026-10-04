import { Router } from 'express';
import { WholesaleController } from '../controllers/wholesaleController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// B2B Clients
router.post('/clients', authMiddleware, WholesaleController.addClient);
router.get('/clients/:pharmacyId', authMiddleware, WholesaleController.getClients);

// B2B Ledgers
router.get('/clients/:clientId/ledger', authMiddleware, WholesaleController.getLedger);
router.post('/clients/:clientId/ledger', authMiddleware, WholesaleController.addLedgerEntry);

export default router;
