import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../config/env';

const migrate = async () => {
  console.log('Starting database migration...');
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Create tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Determine baseline if tracking table is empty
    const trackingCheck = await client.query('SELECT COUNT(*) as count FROM schema_migrations');
    if (parseInt(trackingCheck.rows[0].count) === 0) {
      console.log('Migration tracking table is empty. Checking for existing baseline...');
      
      // Check if bill_item_batches exists (which means 014 was applied)
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'bill_item_batches'
        );
      `);

      if (tableCheck.rows[0].exists) {
        console.log('Found existing baseline up to 014_batch_billing_integration.sql.');
        
        const migrationsDir = path.join(__dirname, '../../database/migrations');
        const allFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        
        // Insert all migrations up to 014 as already applied
        for (const file of allFiles) {
          if (file <= '014_batch_billing_integration.sql') {
            await client.query(
              'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING',
              [file]
            );
            console.log(`Marked ${file} as ALREADY APPLIED (Baseline).`);
          }
        }
      }
    }

    // 3. Fetch applied migrations
    const appliedResult = await client.query('SELECT migration_name FROM schema_migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.migration_name));

    // 4. Execute pending migrations
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    let executedCount = 0;
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`Skipping ${file} - already applied.`);
        continue;
      }

      console.log(`Applying pending migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Successfully applied ${file}.`);
        executedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`ERROR applying migration ${file}:`, error);
        throw error;
      }
    }
    
    console.log(`Migrations completed successfully! (${executedCount} executed)`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

migrate();
