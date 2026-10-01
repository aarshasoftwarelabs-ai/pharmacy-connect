import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET?: string;
  BREVO_API_KEY?: string;
}

const getEnvConfig = (): EnvConfig => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const DATABASE_URL = process.env.DATABASE_URL;
  const JWT_SECRET = process.env.JWT_SECRET;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!DATABASE_URL) {
    console.error('❌ FATAL ERROR: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  return {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    BREVO_API_KEY,
  };
};

export const env = getEnvConfig();
