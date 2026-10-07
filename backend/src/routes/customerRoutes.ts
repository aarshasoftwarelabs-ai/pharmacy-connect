import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Pharmacy PC CRM Routes
router.get('/', requirePermission('CUSTOMERS_VIEW'), CustomerController.getCustomers);
router.get('/:id', requirePermission('CUSTOMERS_VIEW'), CustomerController.getCustomerById);
router.get('/:id/bills', requirePermission('CUSTOMER_HISTORY_VIEW'), CustomerController.getCustomerBills);
router.get('/:id/requests', requirePermission('CUSTOMER_HISTORY_VIEW'), CustomerController.getCustomerRequests);
router.put('/:id', requirePermission('CUSTOMERS_EDIT'), CustomerController.updateCustomer);

export default router;
