-- Migration: 008_profit_tracking.sql
-- Description: Add mrp, purchase_price to medicines, and profit tracking to bills

ALTER TABLE medicines
ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing medicines to have a default purchase price (e.g. 70% of selling price)
UPDATE medicines SET purchase_price = selling_price * 0.7 WHERE purchase_price = 0.00 OR purchase_price IS NULL;
UPDATE medicines SET mrp = selling_price * 1.1 WHERE mrp = 0.00 OR mrp IS NULL;

ALTER TABLE bill_items
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS profit DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2) DEFAULT 0.00;
