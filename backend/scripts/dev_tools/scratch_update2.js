const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query("UPDATE users SET email = 'deeplodaliya007@gmail.com' WHERE phone = '9664781007' RETURNING *");
    console.log("Updated User:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
