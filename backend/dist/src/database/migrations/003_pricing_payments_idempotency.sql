-- 003: Dynamic pricing history, scheduled prices, payment idempotency.
-- Safe additive migration — does not delete customer/order/payment data.

CREATE TABLE IF NOT EXISTS product_price_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  previous_unit_price NUMERIC(12, 4),
  new_unit_price NUMERIC(12, 4) NOT NULL,
  previous_trolley_rate NUMERIC(14, 2),
  new_trolley_rate NUMERIC(14, 2),
  wholesale_price NUMERIC(12, 4),
  retail_price NUMERIC(12, 4),
  bulk_price NUMERIC(12, 4),
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  reason TEXT,
  effective_at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_price_history_product ON product_price_history (tenant_id, product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS product_price_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_price NUMERIC(12, 4) NOT NULL,
  trolley_rate NUMERIC(14, 2),
  wholesale_price NUMERIC(12, 4),
  retail_price NUMERIC(12, 4),
  bulk_price NUMERIC(12, 4),
  reason TEXT,
  activate_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  activated_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_price_schedules_due ON product_price_schedules (tenant_id, status, activate_at);

-- Idempotency ledger for payment / order / refund operations
CREATE TABLE IF NOT EXISTS payment_idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  response_json JSONB,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_idem_gateway_payment
  ON payment_idempotency_keys (gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_payment_idem_tenant_op
  ON payment_idempotency_keys (tenant_id, operation, created_at DESC);

-- Extend products with commerce fields used by dynamic pricing (nullable / additive)
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(12, 4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(12, 4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price NUMERIC(12, 4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 5.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_qty INT DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_updated_by TEXT;
