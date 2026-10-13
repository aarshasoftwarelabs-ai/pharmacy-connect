import pool from '../config/database';

export const ensureSchema = async () => {
  try {
    console.log('🔄 Ensuring required database schema (barcode, delivery, returns)...');

    // 1. Barcode columns
    await pool.query(`
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
      CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);

      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
      CREATE INDEX IF NOT EXISTS idx_medicine_batches_barcode ON medicine_batches(barcode);
    `);

    // 2. Delivery assignment columns on bills
    await pool.query(`
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_staff_id INTEGER REFERENCES staff_members(id) ON DELETE SET NULL;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'DIRECT_PICKUP';
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS cash_collection_status VARCHAR(50) DEFAULT 'PAID';
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS cash_collected_amount NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
      CREATE INDEX IF NOT EXISTS idx_bills_delivery_staff ON bills(delivery_staff_id);
    `);

    // 3. Distributor Returns (Expiry & Return to Distributor Module)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS distributor_returns (
          id SERIAL PRIMARY KEY,
          pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
          distributor_id INTEGER,
          supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
          challan_number VARCHAR(100) NOT NULL,
          return_date DATE NOT NULL DEFAULT CURRENT_DATE,
          total_items INTEGER DEFAULT 0,
          total_amount NUMERIC(12,2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'PENDING',
          credit_note_number VARCHAR(100),
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_distributor_returns_pharmacy ON distributor_returns(pharmacy_id);

      CREATE TABLE IF NOT EXISTS distributor_return_items (
          id SERIAL PRIMARY KEY,
          return_id INTEGER NOT NULL REFERENCES distributor_returns(id) ON DELETE CASCADE,
          medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
          medicine_name VARCHAR(255) NOT NULL,
          batch_number VARCHAR(100) NOT NULL,
          expiry_date DATE NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
          reason VARCHAR(100) DEFAULT 'EXPIRED',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_distributor_return_items_return ON distributor_return_items(return_id);
    `);

    console.log('✅ Database schema verified and updated successfully.');
  } catch (error) {
    console.error('⚠️ Note during schema check:', error);
  }
};
