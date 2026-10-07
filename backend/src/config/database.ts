import { Pool } from 'pg';
import { env } from './env';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
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
