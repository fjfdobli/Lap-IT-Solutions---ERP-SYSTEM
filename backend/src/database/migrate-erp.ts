import { erpPool } from './database'

async function migrate() {
  console.log('Starting ERP database migration...')
  
  try {
    await erpPool.query(`
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
        INDEX idx_is_active (is_active)
      )
    `)
    
    await erpPool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_name (name)
      )
    `)
    
    await erpPool.query(`
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
        INDEX idx_category_id (category_id)
      )
    `)
    
    await erpPool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id CHAR(36) PRIMARY KEY,
        product_id CHAR(36) NOT NULL UNIQUE,
        quantity_on_hand INT DEFAULT 0,
        quantity_reserved INT DEFAULT 0,
        quantity_on_order INT DEFAULT 0,
        last_count_date DATETIME NULL,
        last_count_by CHAR(36) NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_product_id (product_id)
      )
    `)
    
    await erpPool.query(`
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
        created_by CHAR(36) NOT NULL,
        approved_by CHAR(36) NULL,
        approved_at DATETIME NULL,
        approval_notes TEXT NULL,
        delivery_receipt_filed BOOLEAN DEFAULT FALSE,
        filed_by CHAR(36) NULL,
        filed_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_po_number (po_number),
        INDEX idx_supplier_id (supplier_id),
        INDEX idx_status (status),
        INDEX idx_order_date (order_date),
        INDEX idx_created_by (created_by)
      )
    `)

    await erpPool.query(`
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
        INDEX idx_product_id (product_id)
      )
    `)

    await erpPool.query(`
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
        INDEX idx_created_at (created_at)
      )
    `)

    await erpPool.query(`
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
        INDEX idx_received_date (received_date)
      )
    `)

    const [existingCategories] = await erpPool.query('SELECT COUNT(*) as count FROM categories')
    if ((existingCategories as any)[0].count === 0) {
      await erpPool.query(`
        INSERT INTO categories (id, name, description, is_active, created_at, updated_at) VALUES
        (UUID(), 'Electronics', 'Electronic devices and components', TRUE, NOW(), NOW()),
        (UUID(), 'Office Supplies', 'Office consumables and supplies', TRUE, NOW(), NOW()),
        (UUID(), 'Computer Hardware', 'Computer parts and peripherals', TRUE, NOW(), NOW()),
        (UUID(), 'Software', 'Software licenses and subscriptions', TRUE, NOW(), NOW()),
        (UUID(), 'Networking', 'Networking equipment and cables', TRUE, NOW(), NOW())
      `)
    }

    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
