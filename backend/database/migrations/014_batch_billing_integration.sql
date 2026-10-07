-- Migration 014: Batch Billing Integration and Stock Movements

-- 1. Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES medicine_batches(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- PURCHASE, SALE, SALE_RETURN, PURCHASE_RETURN, ADJUSTMENT, EXPIRY, DAMAGE
    reference_type VARCHAR(50), -- PURCHASE_INVOICE, BILL
    reference_id INTEGER,
    quantity INTEGER NOT NULL, -- Positive or negative depending on movement
    previous_quantity INTEGER NOT NULL DEFAULT 0,
    new_quantity INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_pharmacy ON stock_movements(pharmacy_id);
CREATE INDEX idx_stock_movements_medicine ON stock_movements(medicine_id);
CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_id);

-- 2. Create bill_item_batches table to track which batches were sold in a bill
CREATE TABLE IF NOT EXISTS bill_item_batches (
    id SERIAL PRIMARY KEY,
    bill_item_id INTEGER NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
    batch_id INTEGER NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bill_item_batches_item ON bill_item_batches(bill_item_id);

-- 3. Add constraint on purchase_invoices for unique invoice numbers per supplier per pharmacy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unq_purchase_invoice_supplier'
    ) THEN
        ALTER TABLE purchase_invoices ADD CONSTRAINT unq_purchase_invoice_supplier UNIQUE (pharmacy_id, supplier_id, invoice_number);
    END IF;
END $$;
