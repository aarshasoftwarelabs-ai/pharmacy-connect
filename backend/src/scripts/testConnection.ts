import { Client } from 'pg';
import { env } from '../config/env';

const testConnection = async () => {
  // Prevent printing the actual connection string
  if (!env.DATABASE_URL || env.DATABASE_URL.includes('postgresql://user:pass@host')) {
    console.error('ERROR: DATABASE_URL is missing or using a placeholder value.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 AS connected');
    if (res.rows[0].connected === 1) {
      console.log('SUCCESS: Connected to the database.');
    } else {
      console.error('ERROR: Query returned unexpected result.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('ERROR: Could not connect to the database.');
    // Print the error message, but explicitly mask any connection string just in case
    const safeError = error?.message ? error.message.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@') : 'Unknown error';
    console.error('Details:', safeError);
    process.exit(1);
  } finally {
    await client.end();
  }
};

testConnection();
