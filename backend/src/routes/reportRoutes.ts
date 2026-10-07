import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

// Apply auth middleware to all routes in this file
router.use(authenticate);

router.get('/sales/:pharmacyId', requirePermission('REPORTS_VIEW'), ReportController.getSalesReport);
router.get('/billing/:pharmacyId', requirePermission('REPORTS_VIEW'), ReportController.getBillingReport);
router.get('/medicine-sales/:pharmacyId', requirePermission('REPORTS_VIEW'), ReportController.getMedicineSalesReport);
router.get('/medicine-requests/:pharmacyId', requirePermission('REPORTS_VIEW'), ReportController.getMedicineRequestReport);
router.get('/customers/:pharmacyId', requirePermission('CUSTOMERS_VIEW'), ReportController.getCustomerReport);
router.get('/gst/:pharmacyId', requirePermission('REPORTS_VIEW'), ReportController.getGstReport);

export default router;
