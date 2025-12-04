-- [MIGRATION] 001_schema.sql
-- Schema iniziale del database HotelCRM
-- Versione: 1.0.0
-- Data: 2024

-- ============================================
-- TABELLE PRINCIPALI
-- ============================================

-- SELLERS (Venditori)
CREATE TABLE IF NOT EXISTS sellers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT,
    contact_preference TEXT NOT NULL DEFAULT 'telefono'
        CHECK (contact_preference IN ('telefono', 'email')),
    preferred_hours TEXT,
    notes TEXT DEFAULT '',
    last_contact TEXT,  -- ISO datetime
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sellers_name ON sellers(name);
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_last_contact ON sellers(last_contact);


-- PROPERTIES (Immobili)
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    -- Address fields (denormalized for simplicity)
    address_street TEXT NOT NULL,
    address_number TEXT,
    address_city TEXT NOT NULL,
    address_cap TEXT NOT NULL,
    address_province TEXT NOT NULL,
    address_country TEXT NOT NULL DEFAULT 'Italia',
    -- Property details
    type TEXT NOT NULL CHECK (type IN ('hotel', 'b&b', 'affittacamere', 'residence', 'altro')),
    category TEXT NOT NULL DEFAULT 'n/a' CHECK (category IN ('1*', '2*', '3*', '4*', '5*', 'n/a')),
    rooms INTEGER NOT NULL DEFAULT 0,
    beds INTEGER NOT NULL DEFAULT 0,
    condition TEXT NOT NULL CHECK (condition IN ('ottimo', 'buono', 'da_ristrutturare', 'in_costruzione')),
    price_min INTEGER NOT NULL,
    price_max INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    -- Foreign keys
    seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_seller ON properties(seller_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(address_city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_min, price_max);


-- BUYERS (Compratori)
CREATE TABLE IF NOT EXISTS buyers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    budget_min INTEGER NOT NULL DEFAULT 0,
    budget_max INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    level TEXT CHECK (level IN ('privato', 'fondo', 'gruppo_alberghiero', 'investitore')),
    notes TEXT DEFAULT '',
    last_contact TEXT,  -- ISO datetime
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_buyers_name ON buyers(name);
CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email);
CREATE INDEX IF NOT EXISTS idx_buyers_budget ON buyers(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_buyers_last_contact ON buyers(last_contact);


-- DEALS (Trattative)
CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'nuovo_contatto'
        CHECK (status IN ('nuovo_contatto', 'in_corso', 'offerta_inviata', 'diligenza', 'chiuso_positivo', 'chiuso_negativo')),
    price_offered INTEGER,
    price_negotiated INTEGER,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_deals_buyer ON deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deals_property ON deals(property_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_updated ON deals(updated_at);


-- ACTIVITIES (Attività delle trattative)
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    date TEXT NOT NULL,  -- ISO datetime
    type TEXT NOT NULL CHECK (type IN ('nota', 'chiamata', 'email', 'appuntamento', 'follow_up')),
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);


-- ============================================
-- TABELLE PER TAG (Many-to-Many)
-- ============================================

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,  -- Opzionale: colore esadecimale
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);


-- Tag per Buyers
CREATE TABLE IF NOT EXISTS buyer_tags (
    buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (buyer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_buyer_tags_buyer ON buyer_tags(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_tags_tag ON buyer_tags(tag_id);


-- Tag per Properties
CREATE TABLE IF NOT EXISTS property_tags (
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_property_tags_property ON property_tags(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tags_tag ON property_tags(tag_id);


-- ============================================
-- TABELLE SUPPLEMENTARI
-- ============================================

-- Zone di interesse per Buyers (Many-to-Many)
CREATE TABLE IF NOT EXISTS buyer_zones (
    buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    zone TEXT NOT NULL,
    PRIMARY KEY (buyer_id, zone)
);

CREATE INDEX IF NOT EXISTS idx_buyer_zones_buyer ON buyer_zones(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_zones_zone ON buyer_zones(zone);


-- Tipologie preferite per Buyers (Many-to-Many)
CREATE TABLE IF NOT EXISTS buyer_preferred_types (
    buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'b&b', 'affittacamere', 'residence', 'altro')),
    PRIMARY KEY (buyer_id, property_type)
);

CREATE INDEX IF NOT EXISTS idx_buyer_types_buyer ON buyer_preferred_types(buyer_id);


-- ============================================
-- TRIGGER PER updated_at
-- ============================================

CREATE TRIGGER IF NOT EXISTS sellers_updated_at
AFTER UPDATE ON sellers
BEGIN
    UPDATE sellers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS properties_updated_at
AFTER UPDATE ON properties
BEGIN
    UPDATE properties SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS buyers_updated_at
AFTER UPDATE ON buyers
BEGIN
    UPDATE buyers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS deals_updated_at
AFTER UPDATE ON deals
BEGIN
    UPDATE deals SET updated_at = datetime('now') WHERE id = NEW.id;
END;
