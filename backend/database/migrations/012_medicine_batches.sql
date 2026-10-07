-- Step 2: Batch + Expiry + Stock Foundation
-- Create medicine_batches table to track multiple batches of the same medicine

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

-- Trigger to update 'updated_at' on medicine_batches
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_medicine_batches_modtime') THEN
        CREATE TRIGGER update_medicine_batches_modtime
        BEFORE UPDATE ON medicine_batches
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END
$$;
