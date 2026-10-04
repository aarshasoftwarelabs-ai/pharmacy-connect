import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

const migrate = async () => {
  console.log('Starting database migration...');
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const sqlPath1 = path.join(__dirname, '../../database/migrations/001_initial_schema.sql');
    const sql1 = fs.readFileSync(sqlPath1, 'utf8');

    const sqlPath2 = path.join(__dirname, '../../database/migrations/002_billing_schema.sql');
    const sql2 = fs.readFileSync(sqlPath2, 'utf8');

    const sqlPath3 = path.join(__dirname, '../../database/migrations/003_offline_billing.sql');
    const sql3 = fs.readFileSync(sqlPath3, 'utf8');

    const sqlPath4 = path.join(__dirname, '../../database/migrations/004_medicines_schema.sql');
    const sql4 = fs.readFileSync(sqlPath4, 'utf8');

    const sqlPath5 = path.join(__dirname, '../../database/migrations/005_add_password_to_users.sql');
    const sql5 = fs.readFileSync(sqlPath5, 'utf8');

    const sqlPath7 = path.join(__dirname, '../../database/migrations/007_add_profile_fields_to_pharmacies.sql');
    const sql7 = fs.readFileSync(sqlPath7, 'utf8');

    const sqlPath8 = path.join(__dirname, '../../database/migrations/008_gst_schema.sql');
    const sql8 = fs.readFileSync(sqlPath8, 'utf8');

    const sqlPath9 = path.join(__dirname, '../../database/migrations/009_profit_tracking.sql');
    const sql9 = fs.readFileSync(sqlPath9, 'utf8');

    const sqlPath10 = path.join(__dirname, '../../database/migrations/010_wholesale_module.sql');
    const sql10 = fs.readFileSync(sqlPath10, 'utf8');

    console.log('Executing migration scripts...');
    await client.query(sql1);
    await client.query(sql2);
    await client.query(sql3);
    await client.query(sql4);
    await client.query(sql5);
    await client.query(sql7);
    await client.query(sql8);
    await client.query(sql9);
    await client.query(sql10);
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

migrate();
