import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('SUPPLIERS_VIEW'), SupplierController.getSuppliers);
router.get('/:id', requirePermission('SUPPLIERS_VIEW'), SupplierController.getSupplierById);
router.post('/', requirePermission('SUPPLIERS_CREATE'), SupplierController.createSupplier);
router.put('/:id', requirePermission('SUPPLIERS_EDIT'), SupplierController.updateSupplier);
router.delete('/:id', requirePermission('SUPPLIERS_DEACTIVATE'), SupplierController.deleteSupplier);

export default router;
