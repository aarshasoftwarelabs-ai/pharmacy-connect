-- Migration: 002_billing_schema.sql
-- Description: Add customer confirmation to medicine requests and create billing tables.

-- 1. Add customer confirmation to medicine_requests
ALTER TABLE medicine_requests 
ADD COLUMN IF NOT EXISTS customer_confirmation VARCHAR(50) DEFAULT 'PENDING' CHECK (customer_confirmation IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    medicine_request_id INTEGER NOT NULL REFERENCES medicine_requests(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
    customer_name VARCHAR(255) NOT NULL,
    bill_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- 4. Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_id ON bills(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_medicine_request_id ON bills(medicine_request_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- 5. Add unique constraint to prevent duplicate bills for the same request
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_bill_per_request'
    ) THEN 
        ALTER TABLE bills ADD CONSTRAINT unique_bill_per_request UNIQUE (medicine_request_id); 
    END IF; 
END $$;
