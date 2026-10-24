const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function test() {
  try {
    const pharmacyId = 1;
    const params = { startDate: '2026-09-01', endDate: '2026-09-30' };
    const values = [];
    
    // Inline buildDateFilter
    let billDateFilter = ` pharmacy_id = $1 `;
    values.push(pharmacyId);
    if (params.startDate) {
      billDateFilter += ` AND bill_date >= $${values.length + 1} `;
      values.push(`${params.startDate}T00:00:00+05:30`);
    }
    if (params.endDate) {
      billDateFilter += ` AND bill_date <= $${values.length + 1} `;
      values.push(`${params.endDate}T23:59:59.999+05:30`);
    }
    
    let searchFilter = '';
    
    const query = `
      SELECT 
        customer_name as "customerName",
        customer_phone as "customerPhone",
        MIN(bill_date) as "firstVisit",
        MAX(bill_date) as "lastVisit",
        COUNT(id) as "totalBills",
        SUM(total) as "totalSpent"
      FROM bills
      WHERE ${billDateFilter} ${searchFilter}
      GROUP BY customer_name, customer_phone
      ORDER BY "totalSpent" DESC
    `;
    
    const result = await pool.query(query, values);
    
    const totalCustomers = result.rows.length;
    let newCustomers = 0;
    let returningCustomers = 0;
    
    const startDateStr = params.startDate ? new Date(params.startDate).getTime() : 0;

    const customers = result.rows.map(row => {
      const isNew = startDateStr && new Date(row.firstVisit).getTime() >= startDateStr;
      if (isNew) newCustomers++; else returningCustomers++;
      
      return {
        ...row,
        totalBills: parseInt(row.totalBills, 10),
        totalSpent: parseFloat(row.totalSpent)
      };
    });
    
    console.log("SUCCESS:", { summary: { totalCustomers, newCustomers, returningCustomers }, customers });
  } catch (err) {
    console.error("SQL ERROR:", err);
  } finally {
    pool.end();
  }
}

test();
