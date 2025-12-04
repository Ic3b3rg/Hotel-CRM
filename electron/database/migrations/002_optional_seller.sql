-- [MIGRATION] 002_optional_seller.sql
-- Rende seller_id opzionale per properties e aggiunge default per altri campi
-- Data: 2024

-- SQLite non supporta ALTER COLUMN, quindi ricreiamo la tabella
PRAGMA foreign_keys=OFF;

-- Ricrea tabella properties con seller_id nullable e default per tutti i campi
CREATE TABLE IF NOT EXISTS properties_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    -- Address fields con default vuoti
    address_street TEXT DEFAULT '',
    address_number TEXT DEFAULT '',
    address_city TEXT DEFAULT '',
    address_cap TEXT DEFAULT '',
    address_province TEXT DEFAULT '',
    address_country TEXT DEFAULT 'Italia',
    -- Property details con default
    type TEXT DEFAULT 'altro' CHECK (type IN ('hotel', 'b&b', 'affittacamere', 'residence', 'altro')),
    category TEXT DEFAULT 'n/a' CHECK (category IN ('1*', '2*', '3*', '4*', '5*', 'n/a')),
    rooms INTEGER DEFAULT 0,
    beds INTEGER DEFAULT 0,
    condition TEXT DEFAULT 'buono' CHECK (condition IN ('ottimo', 'buono', 'da_ristrutturare', 'in_costruzione')),
    price_min INTEGER DEFAULT 0,
    price_max INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    -- seller_id ora nullable
    seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copia i dati esistenti
INSERT INTO properties_new
SELECT * FROM properties;

-- Elimina la vecchia tabella
DROP TABLE IF EXISTS properties;

-- Rinomina la nuova tabella
ALTER TABLE properties_new RENAME TO properties;

-- Ricrea gli indici
CREATE INDEX IF NOT EXISTS idx_properties_seller ON properties(seller_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(address_city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_min, price_max);

-- Ricrea il trigger per updated_at
CREATE TRIGGER IF NOT EXISTS properties_updated_at
AFTER UPDATE ON properties
BEGIN
    UPDATE properties SET updated_at = datetime('now') WHERE id = NEW.id;
END;

PRAGMA foreign_keys=ON;
