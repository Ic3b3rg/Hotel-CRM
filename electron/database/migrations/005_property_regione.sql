-- Migration 005: Aggiunge campo Regione agli immobili
-- PROP-004: Campo Regione con select delle 20 regioni italiane

-- Aggiunge la colonna regione alla tabella properties
ALTER TABLE properties ADD COLUMN regione TEXT DEFAULT '';

-- Crea indice per ricerche efficienti per regione
CREATE INDEX IF NOT EXISTS idx_properties_regione ON properties(regione);
