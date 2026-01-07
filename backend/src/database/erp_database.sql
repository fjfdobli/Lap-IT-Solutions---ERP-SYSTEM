-- =============================================================
-- ERP DATABASE SCHEMA
-- Lap IT Solutions Inc.
-- =============================================================

CREATE DATABASE IF NOT EXISTS erp_database;
USE erp_database;

-- =============================================================
-- USERS TABLE
-- Stores all users: super_admin (web), admin, manager (desktop)
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type ENUM('super_admin', 'admin', 'manager') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by CHAR(36) NULL,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- ROLES TABLE
-- Defines roles for RBAC (primarily for desktop users)
-- =============================================================
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by CHAR(36) NULL,
    
    INDEX idx_name (name),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- PERMISSIONS TABLE
-- Granular permissions for modules
-- =============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id CHAR(36) PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL,
    
    UNIQUE KEY unique_module_action (module, action),
    INDEX idx_module (module)
);

-- =============================================================
-- ROLE_PERMISSIONS TABLE
-- Junction table: roles <-> permissions
-- =============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL,
    
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- =============================================================
-- USER_ROLES TABLE
-- Junction table: users <-> roles
-- =============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL,
    assigned_by CHAR(36) NULL,
    
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- SESSIONS TABLE
-- For JWT refresh tokens
-- =============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token(255)),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- INVITATIONS TABLE
-- For invite-based registration
-- =============================================================
CREATE TABLE IF NOT EXISTS invitations (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_type ENUM('super_admin', 'admin', 'manager') NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by CHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    accepted_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- DEVICES TABLE
-- Registered desktop clients
-- =============================================================
CREATE TABLE IF NOT EXISTS devices (
    id CHAR(36) PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    device_key VARCHAR(255) NOT NULL UNIQUE,
    user_id CHAR(36) NULL,
    last_seen DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at DATETIME NOT NULL,
    
    INDEX idx_device_key (device_key),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- AUDIT_LOGS TABLE
-- Track all significant actions
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id CHAR(36) NULL,
    old_values TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at DATETIME NOT NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- NOTIFICATIONS TABLE
-- Notifications from desktop to web
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    source ENUM('web', 'desktop', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- USER_SETTINGS TABLE
-- Store user preferences including notification settings
-- =============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    
    -- Communication Preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    
    -- Real-Time Activity Notifications
    notify_user_activity BOOLEAN DEFAULT TRUE,
    notify_device_changes BOOLEAN DEFAULT TRUE,
    notify_role_changes BOOLEAN DEFAULT TRUE,
    notify_audit_alerts BOOLEAN DEFAULT TRUE,
    
    -- Security Notifications
    notify_login_alerts BOOLEAN DEFAULT TRUE,
    notify_security_alerts BOOLEAN DEFAULT TRUE,
    notify_system_updates BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- INSERT DEFAULT DATA
-- =============================================================

-- Default Permissions (MVP Modules)
INSERT INTO permissions (id, module, action, description, created_at) VALUES
-- Purchase Order Module
(UUID(), 'purchase_order', 'view', 'View purchase orders', NOW()),
(UUID(), 'purchase_order', 'create', 'Create purchase orders', NOW()),
(UUID(), 'purchase_order', 'edit', 'Edit purchase orders', NOW()),
(UUID(), 'purchase_order', 'delete', 'Delete purchase orders', NOW()),
(UUID(), 'purchase_order', 'approve', 'Approve purchase orders', NOW()),
-- Inventory Module
(UUID(), 'inventory', 'view', 'View inventory', NOW()),
(UUID(), 'inventory', 'create', 'Add inventory items', NOW()),
(UUID(), 'inventory', 'edit', 'Edit inventory items', NOW()),
(UUID(), 'inventory', 'delete', 'Delete inventory items', NOW()),
(UUID(), 'inventory', 'adjust', 'Adjust inventory quantities', NOW()),
-- Sales Module
(UUID(), 'sales', 'view', 'View sales records', NOW()),
(UUID(), 'sales', 'create', 'Create sales records', NOW()),
(UUID(), 'sales', 'edit', 'Edit sales records', NOW()),
(UUID(), 'sales', 'delete', 'Delete sales records', NOW()),
(UUID(), 'sales', 'reports', 'View sales reports', NOW()),
-- User Management (for admin)
(UUID(), 'users', 'view', 'View users', NOW()),
(UUID(), 'users', 'create', 'Create users', NOW()),
(UUID(), 'users', 'edit', 'Edit users', NOW()),
(UUID(), 'users', 'delete', 'Delete users', NOW()),
-- Chat Module
(UUID(), 'chat', 'view', 'Access chat', NOW()),
(UUID(), 'chat', 'send', 'Send messages', NOW());

-- Default Roles
INSERT INTO roles (id, name, description, is_system_role, created_at, updated_at) VALUES
(UUID(), 'Admin', 'Full access to all ERP desktop modules', TRUE, NOW(), NOW()),
(UUID(), 'Manager', 'Limited access to ERP desktop modules', TRUE, NOW(), NOW());

-- =============================================================
-- SUPPLIERS TABLE
-- Vendors/Suppliers for purchase orders
-- =============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    viber VARCHAR(50) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by CHAR(36) NULL,
    
    INDEX idx_name (name),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- CATEGORIES TABLE
-- Product/Item categories
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_name (name)
);

-- =============================================================
-- PRODUCTS TABLE
-- Items/Products in inventory
-- =============================================================
CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category_id CHAR(36) NULL,
    unit VARCHAR(50) DEFAULT 'pcs',
    cost_price DECIMAL(12, 2) DEFAULT 0.00,
    selling_price DECIMAL(12, 2) DEFAULT 0.00,
    reorder_level INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by CHAR(36) NULL,
    
    INDEX idx_sku (sku),
    INDEX idx_name (name),
    INDEX idx_category_id (category_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- INVENTORY TABLE
-- Current stock levels for products
-- =============================================================
CREATE TABLE IF NOT EXISTS inventory (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL UNIQUE,
    quantity_on_hand INT DEFAULT 0,
    quantity_reserved INT DEFAULT 0,
    quantity_on_order INT DEFAULT 0,
    last_count_date DATETIME NULL,
    last_count_by CHAR(36) NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_product_id (product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (last_count_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- PURCHASE_ORDERS TABLE
-- Purchase orders to suppliers
-- =============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id CHAR(36) PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id CHAR(36) NOT NULL,
    status ENUM('draft', 'pending_approval', 'approved', 'sent', 'partial', 'received', 'cancelled', 'on_hold') DEFAULT 'draft',
    order_date DATE NOT NULL,
    expected_date DATE NULL,
    received_date DATE NULL,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT NULL,
    delivery_method ENUM('delivery', 'pickup') DEFAULT 'delivery',
    sent_via ENUM('email', 'viber', 'message', 'other') NULL,
    sent_at DATETIME NULL,
    
    -- Approval workflow
    created_by CHAR(36) NOT NULL,
    approved_by CHAR(36) NULL,
    approved_at DATETIME NULL,
    approval_notes TEXT NULL,
    
    -- Filing reference
    delivery_receipt_filed BOOLEAN DEFAULT FALSE,
    filed_by CHAR(36) NULL,
    filed_at DATETIME NULL,
    
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_po_number (po_number),
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (filed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- PURCHASE_ORDER_ITEMS TABLE
-- Line items for purchase orders
-- =============================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id CHAR(36) PRIMARY KEY,
    purchase_order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT DEFAULT 0,
    unit_cost DECIMAL(12, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_purchase_order_id (purchase_order_id),
    INDEX idx_product_id (product_id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- =============================================================
-- INVENTORY_TRANSACTIONS TABLE
-- Track all inventory movements
-- =============================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    transaction_type ENUM('purchase_receive', 'sale', 'adjustment', 'return', 'transfer', 'count') NOT NULL,
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id CHAR(36) NULL,
    notes TEXT NULL,
    created_by CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL,
    
    INDEX idx_product_id (product_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================================
-- DELIVERY_RECEIPTS TABLE
-- Track delivery receipts for filing
-- =============================================================
CREATE TABLE IF NOT EXISTS delivery_receipts (
    id CHAR(36) PRIMARY KEY,
    purchase_order_id CHAR(36) NOT NULL,
    receipt_number VARCHAR(100) NULL,
    received_date DATE NOT NULL,
    received_by CHAR(36) NOT NULL,
    items_verified BOOLEAN DEFAULT FALSE,
    discrepancy_notes TEXT NULL,
    status ENUM('pending', 'verified', 'filed', 'discrepancy') DEFAULT 'pending',
    filed_by CHAR(36) NULL,
    filed_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_purchase_order_id (purchase_order_id),
    INDEX idx_status (status),
    INDEX idx_received_date (received_date),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (filed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================
-- INSERT DEFAULT CATEGORIES
-- =============================================================
INSERT INTO categories (id, name, description, is_active, created_at, updated_at) VALUES
(UUID(), 'Electronics', 'Electronic devices and components', TRUE, NOW(), NOW()),
(UUID(), 'Office Supplies', 'Office consumables and supplies', TRUE, NOW(), NOW()),
(UUID(), 'Computer Hardware', 'Computer parts and peripherals', TRUE, NOW(), NOW()),
(UUID(), 'Software', 'Software licenses and subscriptions', TRUE, NOW(), NOW()),
(UUID(), 'Networking', 'Networking equipment and cables', TRUE, NOW(), NOW());
