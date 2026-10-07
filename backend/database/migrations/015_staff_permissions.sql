CREATE TABLE IF NOT EXISTS staff_members (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'STAFF',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_permissions (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, pharmacy_id, permission_key)
);

-- Insert initial permissions
INSERT INTO permissions (permission_key, permission_name, module, description) VALUES
('DASHBOARD_VIEW', 'View Dashboard', 'Dashboard', 'Can view the main dashboard'),
('MEDICINES_VIEW', 'View Medicines', 'Medicines', 'Can view medicine inventory'),
('MEDICINES_CREATE', 'Create Medicines', 'Medicines', 'Can add new medicines'),
('MEDICINES_EDIT', 'Edit Medicines', 'Medicines', 'Can edit medicines'),
('MEDICINES_DELETE', 'Delete Medicines', 'Medicines', 'Can delete medicines'),
('INVENTORY_VIEW', 'View Inventory', 'Inventory', 'Can view inventory batches'),
('INVENTORY_ADJUST', 'Adjust Inventory', 'Inventory', 'Can adjust inventory counts'),
('SUPPLIERS_VIEW', 'View Suppliers', 'Suppliers', 'Can view supplier list'),
('SUPPLIERS_CREATE', 'Create Suppliers', 'Suppliers', 'Can add new suppliers'),
('SUPPLIERS_EDIT', 'Edit Suppliers', 'Suppliers', 'Can edit suppliers'),
('SUPPLIERS_DEACTIVATE', 'Deactivate Suppliers', 'Suppliers', 'Can deactivate suppliers'),
('PURCHASES_VIEW', 'View Purchases', 'Purchases', 'Can view purchase records'),
('PURCHASES_CREATE', 'Create Purchases', 'Purchases', 'Can add new purchase bills'),
('PURCHASES_CANCEL', 'Cancel Purchases', 'Purchases', 'Can cancel purchases'),
('BILLING_VIEW', 'View Billing', 'Billing', 'Can view customer bills'),
('BILLING_CREATE', 'Create Bills', 'Billing', 'Can generate customer bills'),
('BILLING_CANCEL', 'Cancel Bills', 'Billing', 'Can cancel customer bills'),
('BILLING_PRINT', 'Print Bills', 'Billing', 'Can print customer bills'),
('CUSTOMERS_VIEW', 'View Customers', 'Customers', 'Can view customers list'),
('CUSTOMERS_EDIT', 'Edit Customers', 'Customers', 'Can edit customer details'),
('MEDICINE_REQUESTS_VIEW', 'View Medicine Requests', 'MedicineRequests', 'Can view medicine requests'),
('MEDICINE_REQUESTS_RESPOND', 'Respond to Requests', 'MedicineRequests', 'Can respond to medicine requests'),
('REPORTS_VIEW', 'View Reports', 'Reports', 'Can view reports'),
('REPORTS_EXPORT', 'Export Reports', 'Reports', 'Can export reports'),
('WHOLESALE_VIEW', 'View Wholesale', 'Wholesale', 'Can view wholesale module'),
('WHOLESALE_CREATE', 'Create Wholesale', 'Wholesale', 'Can create wholesale orders/clients'),
('WHOLESALE_EDIT', 'Edit Wholesale', 'Wholesale', 'Can edit wholesale data'),
('STAFF_VIEW', 'View Staff', 'Staff', 'Can view staff members'),
('STAFF_CREATE', 'Create Staff', 'Staff', 'Can add new staff'),
('STAFF_EDIT', 'Edit Staff', 'Staff', 'Can edit staff details'),
('STAFF_DEACTIVATE', 'Deactivate Staff', 'Staff', 'Can deactivate staff'),
('STAFF_PERMISSIONS', 'Manage Permissions', 'Staff', 'Can manage staff permissions'),
('PHARMACY_PROFILE_VIEW', 'View Profile', 'Profile', 'Can view pharmacy profile'),
('PHARMACY_PROFILE_EDIT', 'Edit Profile', 'Profile', 'Can edit pharmacy profile'),
('SETTINGS_VIEW', 'View Settings', 'Settings', 'Can view system settings'),
('SETTINGS_EDIT', 'Edit Settings', 'Settings', 'Can edit system settings')
ON CONFLICT (permission_key) DO NOTHING;
