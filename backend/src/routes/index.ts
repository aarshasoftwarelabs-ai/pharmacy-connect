import { Router } from 'express';
import medicineRequestRoutes from './medicineRequestRoutes';
import authRoutes from './authRoutes';
import pharmacyRoutes from './pharmacyRoutes';
import { checkDatabaseHealth } from '../config/database';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth) {
    res.status(200).json({ status: 'ok', database: 'connected' });
  } else {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

import billingRoutes from './billingRoutes';
import medicineRoutes from './medicineRoutes';
import distributorRoutes from './distributorRoutes';

// Future route integrations will go here:
router.use('/auth', authRoutes);
import userAuthRoutes from './userAuthRoutes';
router.use('/user/auth', userAuthRoutes);
// router.use('/users', userRoutes);
router.use('/pharmacies', pharmacyRoutes);

router.use('/medicine-requests', medicineRequestRoutes);
router.use('/billing', billingRoutes);
router.use('/medicines', medicineRoutes);
router.use('/distributors', distributorRoutes);
import reportRoutes from './reportRoutes';
import paymentRoutes from './paymentRoutes';

router.use('/reports', reportRoutes);
router.use('/payments', paymentRoutes);
// router.use('/notifications', notificationRoutes);

import wholesaleRoutes from './wholesaleRoutes';
router.use('/wholesale', wholesaleRoutes);

export default router;
