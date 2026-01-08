-- [MIGRATION] 004_property_incarico.sql
-- Adds incarico (mandate) fields to properties table
-- PROP-003: Gestione Incarico con percentuale e scadenza

-- Add has_incarico column (boolean, 0/1)
ALTER TABLE properties ADD COLUMN has_incarico INTEGER DEFAULT 0;

-- Add incarico_percentuale column (decimal percentage)
ALTER TABLE properties ADD COLUMN incarico_percentuale REAL DEFAULT NULL;

-- Add incarico_scadenza column (date string in ISO format)
ALTER TABLE properties ADD COLUMN incarico_scadenza TEXT DEFAULT NULL;

-- Create index for searching properties with expiring incarichi
CREATE INDEX IF NOT EXISTS idx_properties_incarico_scadenza ON properties(incarico_scadenza) WHERE has_incarico = 1;
