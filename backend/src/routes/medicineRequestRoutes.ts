import { Router } from 'express';
import { MedicineRequestController } from '../controllers/medicineRequestController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create request (Customer)
router.post('/', MedicineRequestController.createRequest);

// Get user requests (Customer)
router.get('/user/:userId', MedicineRequestController.getUserRequests);

// Get pharmacy requests (Pharmacy PC)
router.get('/pharmacy/:pharmacyId', authenticate, MedicineRequestController.getPharmacyRequests);

// Get single request (Assuming customer or pharmacy might call this, but typically pharmacy)
router.get('/:requestId', authenticate, MedicineRequestController.getRequestById);

// Update status (Pharmacy Response)
router.patch('/:requestId/status', authenticate, MedicineRequestController.updateStatus);

// Customer confirm request
router.post('/:requestId/confirm', MedicineRequestController.confirmRequest);

// Customer cancel request
router.post('/:requestId/cancel', MedicineRequestController.cancelRequest);

export default router;
