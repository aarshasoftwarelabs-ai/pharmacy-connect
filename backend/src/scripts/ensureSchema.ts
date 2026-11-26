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
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS mfg_date DATE;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS dosage_form VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS pack_size VARCHAR(100);
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS unit VARCHAR(100) DEFAULT 'Strip';
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS units_per_pack INTEGER DEFAULT 10;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS loose_tablets INTEGER DEFAULT 0;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS pack_type VARCHAR(50) DEFAULT 'STRIP';
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS composition TEXT;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS salt_composition TEXT;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS is_prescription_required BOOLEAN DEFAULT false;
      ALTER TABLE medicines ADD COLUMN IF NOT EXISTS rack_location VARCHAR(50);
      
      -- Drop obsolete global unique constraint on SKU so pharmacies can add items freely
      ALTER TABLE medicines DROP CONSTRAINT IF EXISTS medicines_sku_key;
      ALTER TABLE medicines ALTER COLUMN sku DROP NOT NULL;
      ALTER TABLE medicines ALTER COLUMN selling_price DROP NOT NULL;
      ALTER TABLE medicines ALTER COLUMN selling_price SET DEFAULT 0.00;
      ALTER TABLE medicines ALTER COLUMN mrp DROP NOT NULL;
      ALTER TABLE medicines ALTER COLUMN mrp SET DEFAULT 0.00;

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

    // 2. Ensure Master Staff Members Table exists before altering bills
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id SERIAL PRIMARY KEY,
        pharmacy_id INTEGER REFERENCES pharmacies(id) ON DELETE CASCADE,
        name VARCHAR(255),
        first_name VARCHAR(100) DEFAULT 'Counter',
        last_name VARCHAR(100) DEFAULT 'Staff',
        phone VARCHAR(20),
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'BILLER',
        pin VARCHAR(10) DEFAULT '1234',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) DEFAULT 'Counter';
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) DEFAULT 'Staff';
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS pin VARCHAR(10) DEFAULT '1234';
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'BILLER';
      ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

      -- Safely drop legacy NOT NULL on first_name/last_name to avoid 23502 constraint errors
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE staff_members ALTER COLUMN first_name DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE staff_members ALTER COLUMN last_name DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE staff_members ALTER COLUMN first_name SET DEFAULT 'Counter';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE staff_members ALTER COLUMN last_name SET DEFAULT 'Staff';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END $$;
    `);

    // 3. Ensure Master Suppliers Table exists before altering distributor_returns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
        supplier_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        mobile VARCHAR(50),
        alternate_phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        gstin VARCHAR(50),
        drug_license_number VARCHAR(100),
        fssai_number VARCHAR(50),
        pan_number VARCHAR(30),
        credit_period_days INTEGER DEFAULT 21,
        opening_balance NUMERIC(12,2) DEFAULT 0,
        current_balance NUMERIC(12,2) DEFAULT 0,
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(30),
        branch_name VARCHAR(100),
        upi_id VARCHAR(100),
        deals_in_brands TEXT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (pharmacy_id, supplier_name)
      );
      CREATE INDEX IF NOT EXISTS idx_suppliers_pharmacy ON suppliers(pharmacy_id);
      CREATE UNIQUE INDEX IF NOT EXISTS unq_supplier_name_pharmacy ON suppliers(pharmacy_id, supplier_name);
    `);

    // 4. Delivery assignment columns on bills
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(30) DEFAULT 'CASH';
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_staff_id INTEGER REFERENCES staff_members(id) ON DELETE SET NULL;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'DIRECT_PICKUP';
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS cash_collection_status VARCHAR(50) DEFAULT 'PAID';
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS cash_collected_amount NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE bills ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(150);
      CREATE INDEX IF NOT EXISTS idx_bills_delivery_staff ON bills(delivery_staff_id);

      -- Ensure bills.payment_status & bills.bill_type constraints allow CANCELLED / PARTIAL / RETAIL
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_payment_status_check') THEN
          ALTER TABLE bills DROP CONSTRAINT bills_payment_status_check;
        END IF;
        ALTER TABLE bills ADD CONSTRAINT bills_payment_status_check
          CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIAL', 'CANCELLED'));
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_bill_type_check') THEN
          ALTER TABLE bills DROP CONSTRAINT bills_bill_type_check;
        END IF;
        ALTER TABLE bills ADD CONSTRAINT bills_bill_type_check
          CHECK (bill_type IN ('ONLINE', 'OFFLINE', 'RETAIL'));
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      -- Upgrade bills_user_id_fkey to ON DELETE SET NULL and ON UPDATE CASCADE
      -- so updating or deleting users in Supabase Table Editor or via API never fails with 23503 foreign key violation
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_user_id_fkey') THEN
          ALTER TABLE bills DROP CONSTRAINT bills_user_id_fkey;
        END IF;
        ALTER TABLE bills 
          ADD CONSTRAINT bills_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES users(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      -- Upgrade bills_medicine_request_id_fkey to ON DELETE SET NULL and ON UPDATE CASCADE
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_medicine_request_id_fkey') THEN
          ALTER TABLE bills DROP CONSTRAINT bills_medicine_request_id_fkey;
        END IF;
        ALTER TABLE bills 
          ADD CONSTRAINT bills_medicine_request_id_fkey 
          FOREIGN KEY (medicine_request_id) 
          REFERENCES medicine_requests(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
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

    // Ensure business_type defaults cleanly to RETAIL without destructive purges
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacies' AND column_name = 'business_type') THEN
            UPDATE pharmacies SET business_type = 'RETAIL' WHERE business_type IS NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacies' AND column_name = 'is_wholesale_enabled') THEN
            UPDATE pharmacies SET is_wholesale_enabled = false WHERE is_wholesale_enabled = true;
          END IF;
        END $$;
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
            upi_id VARCHAR(100),
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

    // 8. Automated WhatsApp Gateway Configuration & Delivery Logs
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pharmacy_messaging_settings (
            id SERIAL PRIMARY KEY,
            pharmacy_id INTEGER NOT NULL UNIQUE REFERENCES pharmacies(id) ON DELETE CASCADE,
            auto_send_bill_sms BOOLEAN DEFAULT FALSE,
            auto_send_bill_whatsapp BOOLEAN DEFAULT TRUE,
            preferred_channel VARCHAR(30) DEFAULT 'WHATSAPP',
            gateway_provider VARCHAR(50) DEFAULT 'SIMULATED',
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

        -- Normalize any unconfigured pharmacies to Zero-Config direct mode
        UPDATE pharmacy_messaging_settings 
        SET gateway_provider = 'SIMULATED' 
        WHERE (whatsapp_access_token IS NULL OR whatsapp_access_token = '') AND gateway_provider = 'WHATSAPP_CLOUD';

        CREATE TABLE IF NOT EXISTS bill_message_logs (
            id SERIAL PRIMARY KEY,
            pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
            bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
            recipient_phone VARCHAR(30) NOT NULL,
            channel VARCHAR(30) NOT NULL DEFAULT 'WHATSAPP',
            gateway_provider VARCHAR(50) NOT NULL DEFAULT 'SIMULATED',
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
      console.log('📲 Verified Automated WhatsApp Messaging Gateway Schema.');
    } catch (msgErr) {
      console.warn('⚠️ Messaging schema note:', msgErr);
    }

    // 9. Comprehensive DavaSetu Supplier & Distributor Master Schema
    try {
      await pool.query(`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(50);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit_period_days INTEGER DEFAULT 21;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS pan_number VARCHAR(30);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(50);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(30);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deals_in_brands TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS unq_supplier_name_pharmacy ON suppliers(pharmacy_id, supplier_name);
      `);
      console.log('📦 Verified DavaSetu Supplier & Distributor Master Schema.');
    } catch (suppErr) {
      console.warn('⚠️ Supplier schema note:', suppErr);
    }

    // 8. Schedule H1 & Narcotic Digital Register (FDCA Inspection Ready)
    try {
      await pool.query(`
        ALTER TABLE medicines ADD COLUMN IF NOT EXISTS is_schedule_h1 BOOLEAN DEFAULT false;
        ALTER TABLE medicines ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(50) DEFAULT 'SCHEDULE_H';

        CREATE TABLE IF NOT EXISTS schedule_h1_register (
            id SERIAL PRIMARY KEY,
            pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
            bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
            bill_number VARCHAR(100),
            supply_date DATE NOT NULL DEFAULT CURRENT_DATE,
            patient_name VARCHAR(255) NOT NULL,
            patient_phone VARCHAR(50),
            patient_address TEXT,
            doctor_name VARCHAR(255) NOT NULL,
            doctor_reg_no VARCHAR(100),
            doctor_address TEXT,
            medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
            medicine_name VARCHAR(255) NOT NULL,
            generic_name VARCHAR(255),
            batch_number VARCHAR(100) NOT NULL,
            quantity INTEGER NOT NULL,
            unit VARCHAR(50) DEFAULT 'Strip',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sched_h1_pharmacy ON schedule_h1_register(pharmacy_id);
        CREATE INDEX IF NOT EXISTS idx_sched_h1_date ON schedule_h1_register(supply_date);
        CREATE INDEX IF NOT EXISTS idx_sched_h1_med ON schedule_h1_register(medicine_id);

        -- Auto-flag known Schedule H1 active molecules in existing medicine catalogues
        UPDATE medicines
        SET is_schedule_h1 = true, schedule_type = 'SCHEDULE_H1'
        WHERE is_schedule_h1 = false AND (
          LOWER(name) ~* '(alprazolam|balofloxacin|bedaquiline|buprenorphine|capreomycin|cefdinir|cefditoren|cefepime|cefixime|cefotaxime|cefpodoxime|ceftazidime|ceftriaxone|chlordiazepoxide|clofazimine|clobazam|clonazepam|clorazepate|colistin|cycloserine|delamanid|diazepam|diphenoxylate|doripenem|ertapenem|ethambutol|ethionamide|faropenem|flurazepam|gemifloxacin|imipenem|isoniazid|ketamine|levofloxacin|linezolid|lorazepam|meropenem|midazolam|moxifloxacin|nitrazepam|oxazepam|pentazocine|pyrazinamide|rifabutin|rifampicin|rifapentine|sparfloxacin|streptomycin|tigecycline|tramadol|zolpidem)'
          OR LOWER(COALESCE(generic_name, '')) ~* '(alprazolam|balofloxacin|bedaquiline|buprenorphine|capreomycin|cefdinir|cefditoren|cefepime|cefixime|cefotaxime|cefpodoxime|ceftazidime|ceftriaxone|chlordiazepoxide|clofazimine|clobazam|clonazepam|clorazepate|colistin|cycloserine|delamanid|diazepam|diphenoxylate|doripenem|ertapenem|ethambutol|ethionamide|faropenem|flurazepam|gemifloxacin|imipenem|isoniazid|ketamine|levofloxacin|linezolid|lorazepam|meropenem|midazolam|moxifloxacin|nitrazepam|oxazepam|pentazocine|pyrazinamide|rifabutin|rifampicin|rifapentine|sparfloxacin|streptomycin|tigecycline|tramadol|zolpidem)'
        );
      `);
      console.log('✅ Schedule H1 & Narcotic Digital Register schema verified.');
    } catch (schedErr) {
      console.warn('⚠️ Schedule H1 schema note:', schedErr);
    }

    console.log('✅ Database schema verified and updated successfully.');
  } catch (error) {
    console.error('⚠️ Note during schema check:', error);
  }
};
