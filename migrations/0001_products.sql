CREATE TABLE products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    scale REAL NOT NULL,
    platform_config TEXT NOT NULL CHECK (json_valid(platform_config)),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    cta_label TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_active ON products (active);
