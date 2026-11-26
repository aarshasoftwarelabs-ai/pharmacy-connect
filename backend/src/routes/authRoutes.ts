import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, strictAuthLimiter } from '../middleware/auth';

const router = Router();

router.post('/check-mobile', strictAuthLimiter, AuthController.checkMobile);
router.post('/verify-otp', strictAuthLimiter, AuthController.verifyOtp);
router.post('/login', strictAuthLimiter, AuthController.login);
router.post('/register', strictAuthLimiter, AuthController.register);
router.post('/staff-login', strictAuthLimiter, AuthController.staffLogin);
router.post('/lookup-counter-user', strictAuthLimiter, AuthController.lookupCounterUser);
router.delete('/account', authenticate, AuthController.deleteAccount);

export default router;
