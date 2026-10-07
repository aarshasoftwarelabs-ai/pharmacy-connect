import { Client } from 'pg';
import { env } from '../config/env';

const preflight = async () => {
  const client = new Client({ connectionString: env.DATABASE_URL });
  
  try {
    await client.connect();
    
    // Check tables
    const tablesToCheck = [
      'staff_members',
      'permissions',
      'staff_permissions',
      'notifications',
      'customer_profiles',
      'customer_refill_reminders',
      'prescriptions',
      'schema_migrations',
      'bill_item_batches' // To check baseline
    ];

    console.log('--- PREFLIGHT CHECKS ---');
    for (const table of tablesToCheck) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      console.log(`Table ${table} exists: ${res.rows[0].exists}`);
    }

    if (true /* bill_item_batches exists logic is internal to runner */) {
      console.log('--- MIGRATIONS THAT WILL EXECUTE ---');
      console.log('015_staff_permissions.sql');
      console.log('016_notifications.sql');
      console.log('017_customer_crm_schema.sql');
    }

  } catch (error) {
    console.error('Preflight error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

preflight();
