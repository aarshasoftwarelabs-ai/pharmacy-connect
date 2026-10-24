const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
  });
  await client.connect();
  const tables = ['bills', 'bill_items', 'users', 'audit_logs', 'medicine_requests'];
  
  for (const table of tables) {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1;
    `, [table]);
    console.log(`\n--- ${table} ---`);
    console.log(res.rows.map(r => `${r.column_name}: ${r.data_type}`).join('\n'));
  }
  await client.end();
}

main().catch(console.error);
