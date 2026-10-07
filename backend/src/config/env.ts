import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET?: string;
  BREVO_API_KEY?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  CORS_ORIGINS?: string;
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
  };
};

export const env = getEnvConfig();
