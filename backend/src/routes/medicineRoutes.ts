import { Router } from 'express';
import { MedicineController } from '../controllers/medicineController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.get('/', authenticate, requirePermission('MEDICINES_VIEW'), MedicineController.getMedicines);
router.get('/lookup-barcode/:barcode', authenticate, MedicineController.lookupBarcode);
router.get('/dead-stock', authenticate, requirePermission('MEDICINES_VIEW'), MedicineController.getDeadStock);
router.post('/', authenticate, requirePermission('MEDICINES_CREATE'), MedicineController.createMedicine);
router.post('/bulk-import', authenticate, MedicineController.bulkImport);
router.post('/generate-barcodes', authenticate, requirePermission('MEDICINES_EDIT'), MedicineController.generateBarcodes);
router.put('/:id', authenticate, requirePermission('MEDICINES_EDIT'), MedicineController.updateMedicine);
router.delete('/:id', authenticate, requirePermission('MEDICINES_DELETE'), MedicineController.deleteMedicine);

export default router;
