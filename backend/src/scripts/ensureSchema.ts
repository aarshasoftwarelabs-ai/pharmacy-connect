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
      CREATE TABLE IF NOT EXISTS distributors (
          id SERIAL PRIMARY KEY,
          pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          whatsapp_number VARCHAR(50),
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_distributors_pharmacy ON distributors(pharmacy_id);

      CREATE TABLE IF NOT EXISTS distributor_returns (
          id SERIAL PRIMARY KEY,
          pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
          distributor_id INTEGER REFERENCES distributors(id) ON DELETE SET NULL,
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
    `);

    // 4. Staff members schema fix (pin, name, role, is_active)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id SERIAL PRIMARY KEY,
        pharmacy_id INTEGER REFERENCES pharmacies(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'BILLER',
        pin VARCHAR(10) DEFAULT '1234',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS pin VARCHAR(10) DEFAULT '1234';
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'BILLER';
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    // Ensure at least one default staff exists for existing pharmacies
    const existingPharms = await pool.query(`SELECT id, name, phone FROM pharmacies ORDER BY id ASC`);
    for (const p of existingPharms.rows) {
      const staffCheck = await pool.query(`SELECT id FROM staff_members WHERE pharmacy_id = $1 LIMIT 1`, [p.id]);
      if (staffCheck.rows.length === 0) {
        await pool.query(`
          INSERT INTO staff_members (pharmacy_id, name, phone, role, pin, is_active)
          VALUES ($1, 'Counter Staff', COALESCE($2, '9876543210'), 'BILLER', '1234', true)
        `, [p.id, p.phone]);
        console.log(`👤 Auto-created default staff (PIN: 1234) for pharmacy ${p.name} (ID: ${p.id})`);
      }
    }

    // Ensure owner user for deeplodaliya007@gmail.com exists with password Jenish009@@@
    try {
      const bcrypt = require('bcrypt');
      const deepHash = await bcrypt.hash('Jenish009@@@', 10);
      const existingDeep = await pool.query(`SELECT id, email FROM users WHERE LOWER(TRIM(email)) = 'deeplodaliya007@gmail.com' LIMIT 1`);
      let ownerUserId: number;
      if (existingDeep.rows.length === 0) {
        const newUser = await pool.query(`
          INSERT INTO users (name, email, phone, password_hash)
          VALUES ('Deep Lodaliya', 'deeplodaliya007@gmail.com', '9876543210', $1)
          RETURNING id
        `, [deepHash]);
        ownerUserId = newUser.rows[0].id;
        console.log(`👤 Created user deeplodaliya007@gmail.com (ID: ${ownerUserId})`);
      } else {
        ownerUserId = existingDeep.rows[0].id;
        await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [deepHash, ownerUserId]);
        console.log(`🔑 Updated password hash for deeplodaliya007@gmail.com (ID: ${ownerUserId})`);
      }

      // Ensure deep's user has a pharmacy if none exists
      const deepPharm = await pool.query(`SELECT id FROM pharmacies WHERE owner_id = $1 LIMIT 1`, [ownerUserId]);
      if (deepPharm.rows.length === 0) {
        await pool.query(`
          INSERT INTO pharmacies (owner_id, name, address, phone, business_type)
          VALUES ($1, 'Deep Pharmacy', 'Store Address', '9876543210', 'RETAIL')
        `, [ownerUserId]);
      }
    } catch (userErr) {
      console.warn('⚠️ User/Staff provision note:', userErr);
    }

    // 5. Wholesale & B2B Data Cleanup (Purge wholesale tables and set all pharmacies to Retail)
    try {
      await pool.query(`
        -- Delete any test wholesale bills
        DELETE FROM bills WHERE bill_type = 'WHOLESALE';
        UPDATE bills SET bill_type = 'RETAIL' WHERE bill_type IS NULL;

        -- Drop Wholesale specific tables if they exist
        DROP TABLE IF EXISTS b2b_ledgers CASCADE;
        DROP TABLE IF EXISTS b2b_clients CASCADE;
        DROP TABLE IF EXISTS delivery_stops CASCADE;
        DROP TABLE IF EXISTS delivery_routes CASCADE;
        DROP TABLE IF EXISTS trade_schemes CASCADE;

        -- Normalize all pharmacies to RETAIL
        UPDATE pharmacies SET business_type = 'RETAIL', is_wholesale_enabled = false WHERE business_type = 'WHOLESALE' OR is_wholesale_enabled = true;
      `);
      console.log('🧹 Successfully purged Wholesale/B2B database records & tables.');
    } catch (cleanErr) {
      console.warn('⚠️ Wholesale purge notice:', cleanErr);
    }

    console.log('✅ Database schema verified and updated successfully.');
  } catch (error) {
    console.error('⚠️ Note during schema check:', error);
  }
};
