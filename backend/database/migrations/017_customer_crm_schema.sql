-- Migration: 017_customer_crm_schema.sql
-- Description: Advanced Customer CRM, Refill Reminders, and Prescription Foundation

-- 1. Create customer_profiles table (Pharmacy-scoped customers)
CREATE TABLE IF NOT EXISTS customer_profiles (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_identity CHECK (user_id IS NOT NULL OR phone IS NOT NULL)
);

-- Unique index for online customers (one profile per user per pharmacy)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_user_pharmacy 
ON customer_profiles(pharmacy_id, user_id) WHERE user_id IS NOT NULL;

-- Unique index for offline customers (one profile per phone per pharmacy)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_phone_pharmacy 
ON customer_profiles(pharmacy_id, phone) WHERE user_id IS NULL AND phone IS NOT NULL;

-- 2. Link existing bills and medicine requests to customer profiles
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS customer_profile_id INTEGER REFERENCES customer_profiles(id) ON DELETE SET NULL;

ALTER TABLE medicine_requests 
ADD COLUMN IF NOT EXISTS customer_profile_id INTEGER REFERENCES customer_profiles(id) ON DELETE SET NULL;

-- 3. Create customer_refill_reminders table
CREATE TABLE IF NOT EXISTS customer_refill_reminders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255), -- for non-inventory items
    source_bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    estimated_refill_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DISMISSED', 'COMPLETED')),
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prevent multiple pending reminders for the same medicine for the same customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_refill 
ON customer_refill_reminders (customer_id, COALESCE(medicine_id, 0), COALESCE(medicine_name, '')) 
WHERE status = 'PENDING';

-- 4. Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_pharmacy ON customer_profiles(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_customer_refill_reminders_pharmacy ON customer_refill_reminders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_customer ON prescriptions(customer_id);

-- Optional: Function to auto-create/update customer_profile on bill insert
-- This can be handled at the application layer or database trigger. We will handle it in the application layer for better control.
