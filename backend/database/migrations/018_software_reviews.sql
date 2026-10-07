CREATE TABLE IF NOT EXISTS software_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  ui_rating INTEGER NOT NULL CHECK (ui_rating >= 1 AND ui_rating <= 5),
  features_rating INTEGER NOT NULL CHECK (features_rating >= 1 AND features_rating <= 5),
  service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pharmacy_id)
);
