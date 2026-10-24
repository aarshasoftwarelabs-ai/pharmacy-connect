const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query("INSERT INTO users (name, phone, email) VALUES ('P Lodaliya', '9999999999', 'plodaliya007@gmail.com') ON CONFLICT (phone) DO NOTHING RETURNING *");
    console.log("Inserted User:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

run();
