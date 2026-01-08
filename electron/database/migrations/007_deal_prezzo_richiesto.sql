-- Migration 007: Add prezzo_richiesto to deals
-- Aggiunge il campo "Prezzo Richiesto" (asking price) alle trattative

-- Add column for asking price
ALTER TABLE deals ADD COLUMN prezzo_richiesto INTEGER DEFAULT NULL;

-- Create index for efficient filtering by asking price
CREATE INDEX IF NOT EXISTS idx_deals_prezzo_richiesto ON deals(prezzo_richiesto);
