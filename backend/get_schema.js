const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
  });
  await client.connect();

  const tables = ['bills', 'bill_items', 'pharmacies', 'medicines', 'inventory'];

  for (const table of tables) {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1;
    `, [table]);
    console.log(`\nTable: ${table}`);
    console.table(res.rows);
  }
  
  await client.end();
}

main().catch(console.error);
