import pool from '../config/database';

export const ensureSchema = async () => {
  try {
    console.log('🔄 Ensuring required database schema (barcode, delivery, returns)...');

    // 1. Medicines & Medicine Batches Schema Integrity
    await pool.query(`
      -- Ensure medicines table columns
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS mrp NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(50) DEFAULT '30049099';
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 12;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiry_date DATE;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS dosage_form VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS pack_size VARCHAR(100);
      
      -- Drop obsolete global unique constraint on SKU so pharmacies can add items freely
      ALTER TABLE medicines DROP CONSTRAINT IF EXISTS medicines_sku_key;
      ALTER TABLE medicines ALTER COLUMN sku DROP NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
      CREATE INDEX IF NOT EXISTS idx_medicines_pharmacy ON medicines(pharmacy_id);

      -- Ensure medicine_batches table exists and has all required columns
      CREATE TABLE IF NOT EXISTS medicine_batches (
          id SERIAL PRIMARY KEY,
          medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
          pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
          batch_number VARCHAR(100) NOT NULL,
          expiry_date DATE NOT NULL,
          mrp NUMERIC(10,2) NOT NULL DEFAULT 0,
          purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
          stock INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(medicine_id, pharmacy_id, batch_number)
      );

      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0;
      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS mrp NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE medicine_batches ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_medicine_batches_barcode ON medicine_batches(barcode);
      CREATE INDEX IF NOT EXISTS idx_medicine_batches_med ON medicine_batches(medicine_id);
      CREATE INDEX IF NOT EXISTS idx_medicine_batches_pharmacy ON medicine_batches(pharmacy_id);

      -- Sync quantity & stock columns
      UPDATE medicine_batches SET available_quantity = stock WHERE (available_quantity = 0 OR available_quantity IS NULL) AND stock > 0;
      UPDATE medicine_batches SET quantity = stock WHERE (quantity = 0 OR quantity IS NULL) AND stock > 0;
      UPDATE medicine_batches SET stock = available_quantity WHERE stock = 0 AND available_quantity > 0;
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

    // Ensure owner user for deeplodaliya007@gmail.com exists with password Jenish009@@@ and is linked to Pharmacy 8
    try {
      const bcrypt = require('bcrypt');
      const deepHash = await bcrypt.hash('Jenish009@@@', 10);
      const existingDeep = await pool.query(`
        SELECT id, email FROM users 
        WHERE LOWER(TRIM(COALESCE(email, ''))) = 'deeplodaliya007@gmail.com' 
           OR id = 9 
        ORDER BY id ASC LIMIT 1
      `);
      let ownerUserId: number;
      if (existingDeep.rows.length === 0) {
        const newUser = await pool.query(`
          INSERT INTO users (name, email, phone, password_hash)
          VALUES ('Deep Lodaliya', 'deeplodaliya007@gmail.com', '9484535043', $1)
          RETURNING id
        `, [deepHash]);
        ownerUserId = newUser.rows[0].id;
        console.log(`👤 Created user deeplodaliya007@gmail.com (ID: ${ownerUserId})`);
      } else {
        ownerUserId = existingDeep.rows[0].id;
        await pool.query(`UPDATE users SET email = 'deeplodaliya007@gmail.com', name = 'Deep Lodaliya', password_hash = $1 WHERE id = $2`, [deepHash, ownerUserId]);
        console.log(`🔑 Verified/Updated password hash for deeplodaliya007@gmail.com (ID: ${ownerUserId})`);
      }

      // Ensure Pharmacy 8 is linked to owner
      await pool.query(
        `UPDATE pharmacies SET owner_id = $1, email = 'deeplodaliya007@gmail.com' WHERE id = 8`,
        [ownerUserId]
      );
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

    // 6. Pharma Sponsored Deals & Schemes Banners Engine
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sponsored_banners (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            badge_text VARCHAR(100) DEFAULT 'SPONSORED SCHEME',
            description TEXT,
            scheme_offer VARCHAR(255),
            banner_image_url TEXT,
            bg_gradient_start VARCHAR(50) DEFAULT '#059669',
            bg_gradient_end VARCHAR(50) DEFAULT '#0f766e',
            action_type VARCHAR(50) DEFAULT 'WHATSAPP',
            action_value VARCHAR(255),
            contact_person VARCHAR(100),
            priority INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            click_count INTEGER DEFAULT 0,
            impression_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed initial sample banners if table is empty
      const existingBanners = await pool.query('SELECT COUNT(*) FROM sponsored_banners');
      if (parseInt(existingBanners.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO sponsored_banners 
            (title, company_name, badge_text, description, scheme_offer, bg_gradient_start, bg_gradient_end, action_type, action_value, contact_person, priority, is_active)
          VALUES 
            (
              'Mankind Monsoon Antibiotics & OTC Mega Scheme',
              'Mankind Pharma Ltd.',
              '10+2 FREE + 6% CASH',
              'Direct distributor dispatch on Dolo-650, Moxikind-CV 625 & Pre-Monsoon stock.',
              'Buy 10 Boxes Get 2 Free + 6% Direct Cash Discount',
              '#059669',
              '#047857',
              'WHATSAPP',
              '919876543210',
              'Mankind Distributor Desk',
              10,
              true
            ),
            (
              'Sun Pharma Pantocid & Volini Direct Wholesale Rate',
              'Sun Pharmaceutical Industries',
              'EXTRA 8% MARGIN',
              'Direct wholesale stockist booking for registered retail pharmacies across Gujarat.',
              'Pantocid DSR & Volini Gel - Flat 8% Extra Retail Margin',
              '#0284c7',
              '#0369a1',
              'CALL',
              '919825012345',
              'Sun Pharma Stockists',
              8,
              true
            ),
            (
              'Cipla Asthalin & Foracort Inhalers Wholesaler Deal',
              'Cipla Therapeutics',
              'SAME DAY DISPATCH',
              'Instant booking on respiratory care & inhalers with flexible 21-day credit terms.',
              'Asthalin / Budecort Inhalers - Same Day Express Dispatch',
              '#7c3aed',
              '#6d28d9',
              'WHATSAPP',
              '919879911223',
              'Cipla Authorized Depot',
              6,
              true
            );
        `);
        console.log('📢 Seeded initial Pharma Sponsored Deals & Schemes banners.');
      }
    } catch (bannerErr) {
      console.warn('⚠️ Sponsored banners schema note:', bannerErr);
    }

    // 7. Pharmacy Plan & Subscription Schema Integrity
    try {
      await pool.query(`
        ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'FREE_TRIAL';
        ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
        
        -- Auto-set 14-day trial end date if missing
        UPDATE pharmacies 
        SET subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '14 days' 
        WHERE subscription_end_date IS NULL AND (plan_type = 'FREE_TRIAL' OR plan_type IS NULL);

        -- Ensure subscription_payments table exists for recording genuine payments (UPI/Cash)
        CREATE TABLE IF NOT EXISTS subscription_payments (
            id SERIAL PRIMARY KEY,
            pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
            amount NUMERIC(10,2) NOT NULL DEFAULT 1499.00,
            currency VARCHAR(10) DEFAULT 'INR',
            payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI',
            payment_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
            transaction_id VARCHAR(100),
            receipt_number VARCHAR(100),
            upi_id VARCHAR(100) DEFAULT 'lodaliya@ptyes',
            agent_note TEXT,
            plan_type VARCHAR(50) NOT NULL DEFAULT 'MOBILE_YEARLY',
            duration_months INTEGER NOT NULL DEFAULT 12,
            billing_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            billing_end_date TIMESTAMP WITH TIME ZONE,
            paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_subscription_payments_pharmacy ON subscription_payments(pharmacy_id);
      `);
      console.log('💳 Verified Pharmacy Subscription & Licensing Schema with Payment Tracking.');
    } catch (subErr) {
      console.warn('⚠️ Subscription schema note:', subErr);
    }

    // 8. Automated SMS & WhatsApp Gateway Configuration & Delivery Logs
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pharmacy_messaging_settings (
            id SERIAL PRIMARY KEY,
            pharmacy_id INTEGER NOT NULL UNIQUE REFERENCES pharmacies(id) ON DELETE CASCADE,
            auto_send_bill_sms BOOLEAN DEFAULT TRUE,
            auto_send_bill_whatsapp BOOLEAN DEFAULT TRUE,
            preferred_channel VARCHAR(30) DEFAULT 'WHATSAPP_AND_SMS',
            gateway_provider VARCHAR(50) DEFAULT 'FAST2SMS',
            sms_api_key TEXT DEFAULT '',
            sms_sender_id VARCHAR(30) DEFAULT 'DAVAST',
            whatsapp_phone_number_id VARCHAR(100) DEFAULT '',
            whatsapp_access_token TEXT DEFAULT '',
            whatsapp_template_name VARCHAR(100) DEFAULT 'bill_invoice',
            custom_sms_template TEXT,
            custom_whatsapp_template TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bill_message_logs (
            id SERIAL PRIMARY KEY,
            pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
            bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
            recipient_phone VARCHAR(30) NOT NULL,
            channel VARCHAR(30) NOT NULL,
            gateway_provider VARCHAR(50) NOT NULL,
            status VARCHAR(30) NOT NULL,
            message_content TEXT,
            gateway_response TEXT,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_msg_settings_pharmacy ON pharmacy_messaging_settings(pharmacy_id);
        CREATE INDEX IF NOT EXISTS idx_bill_msg_logs_pharmacy ON bill_message_logs(pharmacy_id);
        CREATE INDEX IF NOT EXISTS idx_bill_msg_logs_bill ON bill_message_logs(bill_id);
      `);
      console.log('📲 Verified Automated SMS & WhatsApp Messaging Gateway Schema.');
    } catch (msgErr) {
      console.warn('⚠️ Messaging schema note:', msgErr);
    }

    console.log('✅ Database schema verified and updated successfully.');
  } catch (error) {
    console.error('⚠️ Note during schema check:', error);
  }
};
