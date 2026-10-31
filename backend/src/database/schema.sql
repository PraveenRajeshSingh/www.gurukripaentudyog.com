-- Multi-Tenant Brick Supply SaaS - PostgreSQL Schema
-- Migration 001: Core Architecture, Multi-Tenancy, RBAC, Warehouses, Catalog, Orders, Invoices, Sync & Auditing

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE (Each independent brick kiln / supplier / distributor)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    gstin VARCHAR(15) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
    pincode VARCHAR(10) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(10) DEFAULT '#C8460A',
    secondary_color VARCHAR(10) DEFAULT '#2A2A2A',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES ENUM & USERS TABLE
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'DISPATCHER',
    'WAREHOUSE_STAFF',
    'DRIVER',
    'CUSTOMER'
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_phone UNIQUE (tenant_id, phone),
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- 3. WAREHOUSES & KILNS (Bhattas)
CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    location TEXT NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_warehouse_code UNIQUE (tenant_id, code)
);

-- 4. PRODUCTS & PRICING
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'shiv-eent', 'awwal', 'laal-peti', 'premium', etc.
    unit_price NUMERIC(10, 2) NOT NULL, -- e.g., 7.05 for Awwal
    old_price NUMERIC(10, 2),
    trolley_capacity INT DEFAULT 4000, -- 4000 bricks per standard trolley
    trolley_rate NUMERIC(12, 2) NOT NULL, -- e.g., 28200 for Awwal (4000 * 7.05)
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_sku UNIQUE (tenant_id, sku)
);

-- 5. INVENTORY & BATCH LEDGER
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(36) NOT NULL, -- 'KILN_UNLOAD', 'DISPATCH', 'RETURN', 'ADJUSTMENT'
    quantity_change INT NOT NULL, -- positive or negative brick count
    reference_id VARCHAR(100), -- order ID or batch run number
    notes TEXT,
    recorded_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ORDERS & QUOTATIONS
CREATE TYPE order_status_type AS ENUM (
    'PENDING',
    'CONFIRMED',
    'ALLOCATED',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    customer_id VARCHAR(36) REFERENCES users(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    cgst NUMERIC(12, 2) NOT NULL, -- 2.5%
    sgst NUMERIC(12, 2) NOT NULL, -- 2.5%
    total_amount NUMERIC(12, 2) NOT NULL,
    status order_status_type DEFAULT 'PENDING',
    payment_method VARCHAR(30) DEFAULT 'COD', -- 'COD', 'UPI', 'CARD', 'NET_BANKING'
    payment_status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'PARTIAL'
    warehouse_id VARCHAR(36) REFERENCES warehouses(id),
    assigned_driver_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_order_number UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    quantity INT NOT NULL, -- e.g. 4000 bricks (1 trolley)
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

-- 7. INVOICES (GST Tax Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_gstin VARCHAR(15),
    taxable_value NUMERIC(12, 2) NOT NULL,
    cgst NUMERIC(12, 2) NOT NULL,
    sgst NUMERIC(12, 2) NOT NULL,
    grand_total NUMERIC(12, 2) NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_invoice_number UNIQUE (tenant_id, invoice_number)
);

-- 8. OFFLINE SYNC LOG & CONFLICT RESOLUTION
CREATE TABLE IF NOT EXISTS sync_journal (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id),
    entity_name VARCHAR(50) NOT NULL, -- 'orders', 'inventory_ledger', 'deliveries'
    operation VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE'
    client_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'APPLIED', -- 'APPLIED', 'CONFLICT_RESOLVED', 'REJECTED'
    CONSTRAINT unique_device_entity_client_id UNIQUE (tenant_id, device_id, client_id)
);

-- 9. AUDIT LOG (Cross-tenant security and action tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR TENANT ISOLATION PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON inventory_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_tenant ON sync_journal(tenant_id);
