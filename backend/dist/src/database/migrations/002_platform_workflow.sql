-- 002_platform_workflow: persistence for the customer/dealer/admin platform.
-- Column names are the exact snake_case of the API entity fields so the
-- backend store can hydrate/mirror rows without per-table mapping.
-- Run via: npm run migrate (backend/)

CREATE TABLE IF NOT EXISTS platform_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  language TEXT,
  dealer_status TEXT,
  firm_name TEXT,
  gstin TEXT,
  license_no TEXT,
  dealer_address TEXT,
  dealer_city TEXT,
  dealer_discount_pct DOUBLE PRECISION,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_platform_users_tenant_phone ON platform_users (tenant_id, phone);

CREATE TABLE IF NOT EXISTS platform_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  label TEXT NOT NULL,
  line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_addresses_user ON platform_addresses (user_id);

CREATE TABLE IF NOT EXISTS platform_enquiries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  status TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  site_location TEXT NOT NULL,
  notes TEXT,
  lines JSONB NOT NULL DEFAULT '[]',
  attachments JSONB NOT NULL DEFAULT '[]',
  assigned_staff_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_enquiries_tenant_status ON platform_enquiries (tenant_id, status);
CREATE INDEX IF NOT EXISTS ix_platform_enquiries_user ON platform_enquiries (user_id);

CREATE TABLE IF NOT EXISTS platform_quotations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  enquiry_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL,
  lines JSONB NOT NULL DEFAULT '[]',
  subtotal DOUBLE PRECISION NOT NULL,
  discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  taxable_value DOUBLE PRECISION NOT NULL,
  cgst DOUBLE PRECISION NOT NULL,
  sgst DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  notes TEXT,
  valid_until TEXT NOT NULL,
  prepared_by_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_quotations_user ON platform_quotations (user_id);

CREATE TABLE IF NOT EXISTS platform_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  quotation_id TEXT,
  enquiry_id TEXT,
  number TEXT NOT NULL,
  status TEXT NOT NULL,
  lines JSONB NOT NULL DEFAULT '[]',
  subtotal DOUBLE PRECISION NOT NULL,
  discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  taxable_value DOUBLE PRECISION NOT NULL,
  cgst DOUBLE PRECISION NOT NULL,
  sgst DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  expected_delivery TEXT,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_orders_user ON platform_orders (user_id);
CREATE INDEX IF NOT EXISTS ix_platform_orders_tenant_status ON platform_orders (tenant_id, status);

CREATE TABLE IF NOT EXISTS platform_status_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  note TEXT,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  "at" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_events_entity ON platform_status_events (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS platform_device_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_platform_device_user_token ON platform_device_tokens (user_id, token);

CREATE TABLE IF NOT EXISTS platform_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_notifications_user ON platform_notifications (user_id, created_at);

CREATE TABLE IF NOT EXISTS platform_announcements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_saved_sites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_saved_sites_user ON platform_saved_sites (user_id);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  meta JSONB,
  "at" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_platform_audit_tenant ON platform_audit_logs (tenant_id, "at");
