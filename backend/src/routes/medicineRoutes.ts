import { Router } from 'express';
import { MedicineController } from '../controllers/medicineController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, MedicineController.getMedicines);
router.post('/', authenticate, MedicineController.createMedicine);
router.put('/:id', authenticate, MedicineController.updateMedicine);
router.delete('/:id', authenticate, MedicineController.deleteMedicine);

export default router;
