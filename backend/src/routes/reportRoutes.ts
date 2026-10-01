import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes in this file
router.use(authenticate);

router.get('/sales/:pharmacyId', ReportController.getSalesReport);
router.get('/billing/:pharmacyId', ReportController.getBillingReport);
router.get('/medicine-sales/:pharmacyId', ReportController.getMedicineSalesReport);
router.get('/medicine-requests/:pharmacyId', ReportController.getMedicineRequestReport);
router.get('/customers/:pharmacyId', ReportController.getCustomerReport);
router.get('/gst/:pharmacyId', ReportController.getGstReport);

export default router;
