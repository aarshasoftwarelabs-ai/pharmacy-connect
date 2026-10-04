import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pharmacy_connect',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function createMarketingTables() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Create offers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        pharmacy_id INTEGER REFERENCES pharmacies(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        coupon_code VARCHAR(50) UNIQUE NOT NULL,
        discount_percentage NUMERIC(5,2),
        max_discount_amount NUMERIC(10,2),
        min_order_value NUMERIC(10,2),
        valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create campaigns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotional_campaigns (
        id SERIAL PRIMARY KEY,
        pharmacy_id INTEGER REFERENCES pharmacies(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        target_audience VARCHAR(50) NOT NULL DEFAULT 'ALL',
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Successfully created Marketing (Offers & Campaigns) tables in PostgreSQL!');
    client.release();
  } catch (err) {
    console.error('Error creating marketing tables:', err);
  } finally {
    pool.end();
  }
}

createMarketingTables();
