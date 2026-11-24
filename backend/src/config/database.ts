import { Pool } from 'pg';
import { env } from './env';

const isSupabase = env.DATABASE_URL.includes('supabase.com') || env.DATABASE_URL.includes('pooler.supabase.com');

// Create a PostgreSQL connection pool optimized for Supabase Pooler
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: (env.NODE_ENV === 'production' || isSupabase) ? { rejectUnauthorized: false } : false,
  max: 15, // Safe limit for Supabase connection pooler
  idleTimeoutMillis: 30000, // Close idle connections before Supabase pooler terminates them
  connectionTimeoutMillis: 10000, // 10s connection timeout
  allowExitOnIdle: false,
});

// Resilient idle client handling: Never exit process on pooler connection reset
pool.on('error', (err: any) => {
  console.warn('⚠️ Supabase pooler connection notice (auto-reconnecting):', err?.message || err);
});

/**
 * Health check query to verify database connectivity.
 * Executes a lightweight query and returns true if successful.
 */
export const checkDatabaseHealth = async (): Promise<{ healthy: boolean, error?: string }> => {
  try {
    const result = await pool.query('SELECT 1 AS health');
    return { healthy: result.rowCount !== null && result.rowCount > 0 };
  } catch (error: any) {
    const safeError = error?.message ? error.message.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@') : 'Unknown error';
    console.error('Database health check failed:', safeError);
    return { healthy: false, error: safeError };
  }
};

export default pool;
