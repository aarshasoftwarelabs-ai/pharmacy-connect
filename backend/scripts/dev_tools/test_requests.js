const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:Lodaliya009%40%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function test() {
  try {
    const query = `
      SELECT m.id, m.user_id AS "userId", m.pharmacy_id AS "pharmacyId", m.medicine_name AS "medicineName",
             m.image_reference AS "imageReference", m.status, m.response_message AS "responseMessage",
             m.customer_confirmation AS "customerConfirmation", m.confirmed_at AS "confirmedAt",
             m.created_at AS "createdAt", m.updated_at AS "updatedAt",
             u.name AS "customerName", u.phone AS "customerPhone",
             p.name AS "pharmacyName", p.address AS "pharmacyAddress"
      FROM medicine_requests m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.pharmacy_id = $1
    `;
    const result = await pool.query(query, [1]);
    console.log("SUCCESS:", result.rows.length);
  } catch (err) {
    console.error("SQL ERROR:", err);
  } finally {
    pool.end();
  }
}

test();
