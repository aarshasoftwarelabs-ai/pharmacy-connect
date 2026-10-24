const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query("SELECT id, name, email, phone FROM users");
    console.log("Users:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
