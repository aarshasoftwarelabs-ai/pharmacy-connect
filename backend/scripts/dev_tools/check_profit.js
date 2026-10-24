const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres' });
pool.query('SELECT total_profit FROM bills LIMIT 1', (err, res) => {
  if (err) {
    console.error("ERROR:", err.message);
  } else {
    console.log("SUCCESS:", res.rows);
  }
  pool.end();
});
