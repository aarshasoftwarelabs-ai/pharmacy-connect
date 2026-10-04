-- Migration: 010_wholesale_module.sql
-- Description: Add schema for Wholesale (B2B) Module

-- 1. Updates to Existing Tables

-- Enable/Disable wholesale module for a pharmacy
ALTER TABLE pharmacies 
ADD COLUMN IF NOT EXISTS is_wholesale_enabled BOOLEAN DEFAULT false;

-- Add wholesale prices to medicines
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS min_wholesale_qty INTEGER DEFAULT 1;

-- Differentiate between Retail and Wholesale bills
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS bill_type VARCHAR(20) DEFAULT 'RETAIL' CHECK (bill_type IN ('RETAIL', 'WHOLESALE')),
ADD COLUMN IF NOT EXISTS b2b_client_id INTEGER,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- 2. New Tables for Wholesale

-- Table: B2B Clients (Retailers / Clinics / Hospitals)
CREATE TABLE IF NOT EXISTS b2b_clients (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    gstin VARCHAR(15),
    dl_number VARCHAR(100),
    credit_limit DECIMAL(10, 2) DEFAULT 0.00,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key for b2b_client_id in bills table
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_bills_b2b_client'
    ) THEN 
        ALTER TABLE bills ADD CONSTRAINT fk_bills_b2b_client FOREIGN KEY (b2b_client_id) REFERENCES b2b_clients(id) ON DELETE SET NULL;
    END IF; 
END $$;

-- Table: Ledger (Udhaari System / Khata for B2B)
CREATE TABLE IF NOT EXISTS b2b_ledgers (
    id SERIAL PRIMARY KEY,
    b2b_client_id INTEGER NOT NULL REFERENCES b2b_clients(id) ON DELETE CASCADE,
    transaction_type VARCHAR(2) CHECK (transaction_type IN ('DR', 'CR')), -- DR = Bill Generated, CR = Payment Received
    amount DECIMAL(10, 2) NOT NULL,
    reference_id INTEGER, -- e.g., Bill ID or Payment Receipt ID
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Trade Schemes & Offers
CREATE TABLE IF NOT EXISTS trade_schemes (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL,
    free_quantity INTEGER DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_b2b_clients_pharmacy_id ON b2b_clients(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_b2b_ledgers_client_id ON b2b_ledgers(b2b_client_id);
CREATE INDEX IF NOT EXISTS idx_trade_schemes_pharmacy_id ON trade_schemes(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_trade_schemes_medicine_id ON trade_schemes(medicine_id);
