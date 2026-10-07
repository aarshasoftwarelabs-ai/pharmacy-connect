-- 016_notifications.sql

-- Notification Types
-- MEDICINE_REQUEST_CREATED
-- MEDICINE_REQUEST_AVAILABLE
-- MEDICINE_REQUEST_CAN_ARRANGE
-- MEDICINE_REQUEST_NOT_AVAILABLE
-- CUSTOMER_CONFIRMATION_RECEIVED
-- CUSTOMER_REQUEST_CANCELLED
-- BILL_CREATED
-- BILL_READY
-- LOW_STOCK_ALERT
-- NEAR_EXPIRY_ALERT
-- STAFF_PERMISSION_CHANGED
-- STAFF_ACCOUNT_CREATED
-- STAFF_ACCOUNT_DEACTIVATED

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pharmacy_id INTEGER REFERENCES pharmacies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50), -- e.g. 'MEDICINE_REQUEST', 'BILL', 'INVENTORY'
    reference_id INTEGER,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_pharmacy ON notifications(pharmacy_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_user_id, is_read);
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_user_id, created_at DESC);
