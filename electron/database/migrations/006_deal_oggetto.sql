-- Migration 006: Add 'oggetto' field to deals table
-- DEAL-001: Campo Oggetto Trattativa obbligatorio
-- Options: vendita, affitto, gestione

-- Add oggetto column with default empty string (backward compatible)
ALTER TABLE deals ADD COLUMN oggetto TEXT DEFAULT '' CHECK (oggetto IN ('', 'vendita', 'affitto', 'gestione'));

-- Create index for filtering by oggetto
CREATE INDEX IF NOT EXISTS idx_deals_oggetto ON deals(oggetto);
