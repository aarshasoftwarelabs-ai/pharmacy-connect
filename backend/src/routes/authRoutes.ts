import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

router.post('/check-mobile', AuthController.checkMobile);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/staff-login', AuthController.staffLogin);

export default router;
