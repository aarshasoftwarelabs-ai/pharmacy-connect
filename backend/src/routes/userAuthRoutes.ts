import { Router } from 'express';
import { UserAuthController } from '../controllers/userAuthController';
import { strictAuthLimiter } from '../middleware/auth';

const router = Router();

// Send OTP (for signup or login)
router.post('/send-otp', strictAuthLimiter, UserAuthController.sendOtp);

// Verify OTP (automatically handles signup if new user, or login if existing)
router.post('/verify-otp', strictAuthLimiter, UserAuthController.verifyOtp);

export default router;
