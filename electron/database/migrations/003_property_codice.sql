-- [MIGRATION] 003_property_codice.sql
-- Aggiunge il campo codice alla tabella properties
-- Versione: 1.0.0
-- Data: 2026-01-08

-- Aggiunge la colonna codice (opzionale, testo)
ALTER TABLE properties ADD COLUMN codice TEXT DEFAULT '';

-- Crea indice per ricerche sul codice
CREATE INDEX IF NOT EXISTS idx_properties_codice ON properties(codice);
