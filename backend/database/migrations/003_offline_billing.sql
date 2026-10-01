-- Migration: 003_offline_billing.sql
-- Description: Allow offline billing by making request_id and user_id optional and adding bill_type

-- 1. Make medicine_request_id optional (nullable)
ALTER TABLE bills ALTER COLUMN medicine_request_id DROP NOT NULL;

-- 2. Make user_id optional (nullable)
ALTER TABLE bills ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add bill_type column
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS bill_type VARCHAR(20) DEFAULT 'ONLINE' CHECK (bill_type IN ('ONLINE', 'OFFLINE'));

-- 4. Customer phone number is useful for offline customers
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
