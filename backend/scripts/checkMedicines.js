const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/INET/Desktop/pharmacyconnect/backend/.env' });

async function checkMedicines() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT name FROM medicines');
  console.log(res.rows);
  await client.end();
}

checkMedicines().catch(console.error);
