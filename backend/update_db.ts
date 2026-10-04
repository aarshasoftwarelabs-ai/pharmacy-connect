import pool from './src/config/database';

async function updateDb() {
  try {
    await pool.query("ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS business_type VARCHAR(20) DEFAULT 'RETAIL' CHECK (business_type IN ('RETAIL', 'WHOLESALE'));");
    console.log('Database updated successfully');
  } catch (error) {
    console.error('Error updating DB:', error);
  } finally {
    process.exit(0);
  }
}

updateDb();
