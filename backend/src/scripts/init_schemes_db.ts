import pool from '../config/database';

const createSchemesTable = async () => {
  try {
    console.log('Connecting to database...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS b2b_schemes (
        id SERIAL PRIMARY KEY,
        pharmacy_id INTEGER NOT NULL REFERENCES users(id),
        scheme_name VARCHAR(255) NOT NULL,
        medicine_id INTEGER REFERENCES medicines(id),
        min_quantity INTEGER NOT NULL DEFAULT 1,
        free_quantity INTEGER NOT NULL DEFAULT 0,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        valid_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Successfully created b2b_schemes table in PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating b2b_schemes table:', error);
    process.exit(1);
  }
};

createSchemesTable();
