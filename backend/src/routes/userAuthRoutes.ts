import { Router } from 'express';
import { UserAuthController } from '../controllers/userAuthController';

const router = Router();

// Send OTP (for signup or login)
router.post('/send-otp', UserAuthController.sendOtp);

// Verify OTP (automatically handles signup if new user, or login if existing)
router.post('/verify-otp', UserAuthController.verifyOtp);

export default router;
