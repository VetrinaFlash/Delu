PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  compare_at_cents INTEGER,
  category TEXT NOT NULL,
  colors_json TEXT NOT NULL DEFAULT '[]',
  sizes_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  image_url TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

CREATE TABLE IF NOT EXISTS product_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id, sort_order);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, color, size)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
  status TEXT NOT NULL DEFAULT 'Nuovo',
  items_json TEXT NOT NULL,
  shipping_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_fulfillment (
  order_id TEXT PRIMARY KEY,
  carrier TEXT NOT NULL DEFAULT '',
  tracking_code TEXT NOT NULL DEFAULT '',
  tracking_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  order_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'NEXI_XPAY',
  status TEXT NOT NULL DEFAULT 'PENDING',
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  security_token TEXT NOT NULL DEFAULT '',
  operation_id TEXT NOT NULL DEFAULT '',
  operation_result TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shop_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
