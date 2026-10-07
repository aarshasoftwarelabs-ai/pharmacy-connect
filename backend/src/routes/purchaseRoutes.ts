import { Router } from 'express';
import { PurchaseController } from '../controllers/purchaseController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('PURCHASES_VIEW'), PurchaseController.getPurchases);
router.get('/:id', requirePermission('PURCHASES_VIEW'), PurchaseController.getPurchaseById);
router.get('/:id/items', requirePermission('PURCHASES_VIEW'), PurchaseController.getPurchaseItems);
router.post('/', requirePermission('PURCHASES_CREATE'), PurchaseController.createPurchase);
router.post('/:id/cancel', requirePermission('PURCHASES_CANCEL'), PurchaseController.cancelPurchase);

export default router;
