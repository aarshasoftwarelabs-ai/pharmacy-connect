import { Router } from 'express';
import { MedicineController } from '../controllers/medicineController';
import { DistributorController } from '../controllers/distributorController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// AI Medicine Box OCR Text Scanner (Batch No, Exp Date, MRP, Pack Size)
router.post('/scan-box', authenticate, upload.single('image'), MedicineController.scanBox);

router.get('/', authenticate, requirePermission('MEDICINES_VIEW'), MedicineController.getMedicines);
router.get('/lookup-barcode/:barcode', authenticate, MedicineController.lookupBarcode);
router.get('/substitutes', authenticate, MedicineController.getSubstitutes);
router.get('/near-expiry', authenticate, DistributorController.getExpiringMedicines);
router.get('/shortage', authenticate, MedicineController.getShortageMedicines);
router.get('/dead-stock', authenticate, requirePermission('MEDICINES_VIEW'), MedicineController.getDeadStock);
router.post('/', authenticate, requirePermission('MEDICINES_CREATE'), MedicineController.createMedicine);
router.post('/bulk-import', authenticate, requirePermission('MEDICINES_CREATE'), MedicineController.bulkImport);
router.post('/generate-barcodes', authenticate, requirePermission('MEDICINES_EDIT'), MedicineController.generateBarcodes);
router.put('/:id', authenticate, requirePermission('MEDICINES_EDIT'), MedicineController.updateMedicine);
router.delete('/:id', authenticate, requirePermission('MEDICINES_DELETE'), MedicineController.deleteMedicine);

export default router;
