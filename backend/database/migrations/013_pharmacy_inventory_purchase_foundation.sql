-- Migration 013: Pharmacy Inventory Purchase Foundation
-- Modifies medicine_batches and adds suppliers, purchase_invoices, and purchase_items

-- 1. Alter medicine_batches to match the required fields
ALTER TABLE medicine_batches RENAME COLUMN stock TO quantity;
ALTER TABLE medicine_batches ADD COLUMN manufacturing_date DATE;
ALTER TABLE medicine_batches ADD COLUMN selling_price NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE medicine_batches ADD COLUMN reserved_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE medicine_batches ADD COLUMN available_quantity INTEGER NOT NULL DEFAULT 0;

-- Initialize available_quantity
UPDATE medicine_batches SET available_quantity = quantity;

-- Add constraints
ALTER TABLE medicine_batches ADD CONSTRAINT chk_quantity CHECK (quantity >= 0);
ALTER TABLE medicine_batches ADD CONSTRAINT chk_reserved_quantity CHECK (reserved_quantity >= 0);
ALTER TABLE medicine_batches ADD CONSTRAINT chk_available_quantity CHECK (available_quantity >= 0);
ALTER TABLE medicine_batches ADD CONSTRAINT chk_purchase_price CHECK (purchase_price >= 0);
ALTER TABLE medicine_batches ADD CONSTRAINT chk_mrp CHECK (mrp >= 0);
ALTER TABLE medicine_batches ADD CONSTRAINT chk_selling_price CHECK (selling_price >= 0);

CREATE INDEX idx_medicine_batches_pharmacy ON medicine_batches(pharmacy_id);
CREATE INDEX idx_medicine_batches_medicine ON medicine_batches(medicine_id);
CREATE INDEX idx_medicine_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX idx_medicine_batches_batch_num ON medicine_batches(batch_number);

-- 2. Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    mobile VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gstin VARCHAR(50),
    drug_license_number VARCHAR(100),
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_suppliers_pharmacy ON suppliers(pharmacy_id);
ALTER TABLE suppliers ADD CONSTRAINT unq_supplier_name_pharmacy UNIQUE(pharmacy_id, supplier_name);

-- 3. Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    taxable_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
    cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cgst_amount >= 0),
    sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sgst_amount >= 0),
    igst_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (igst_amount >= 0),
    total_tax NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_tax >= 0),
    round_off NUMERIC(12,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_purchases_pharmacy ON purchase_invoices(pharmacy_id);

-- 4. Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id INTEGER NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    free_quantity INTEGER NOT NULL DEFAULT 0 CHECK (free_quantity >= 0),
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    mrp NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (mrp >= 0),
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    taxable_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (gst_rate >= 0),
    cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cgst_amount >= 0),
    sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sgst_amount >= 0),
    igst_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (igst_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for modtime updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_modtime') THEN
        CREATE TRIGGER update_suppliers_modtime
        BEFORE UPDATE ON suppliers
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_invoices_modtime') THEN
        CREATE TRIGGER update_purchase_invoices_modtime
        BEFORE UPDATE ON purchase_invoices
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END
$$;
