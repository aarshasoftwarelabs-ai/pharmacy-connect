import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET?: string;
  BREVO_API_KEY?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  CORS_ORIGINS?: string;
  GEMINI_API_KEY?: string;
  FAST2SMS_API_KEY?: string;
  MSG91_AUTH_KEY?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
}

const getEnvConfig = (): EnvConfig => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const DATABASE_URL = process.env.DATABASE_URL;
  const JWT_SECRET = process.env.JWT_SECRET;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const CORS_ORIGINS = process.env.CORS_ORIGINS;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!DATABASE_URL) {
    console.error('❌ FATAL ERROR: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
    process.exit(1);
  }

  return {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    BREVO_API_KEY,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    CORS_ORIGINS,
    GEMINI_API_KEY,
    FAST2SMS_API_KEY,
    MSG91_AUTH_KEY,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN
  };
};

export const env = getEnvConfig();
