-- Migration 009: Add commission fields to deals
-- DEAL-003: Gestione Provvigioni compratore e venditore

-- Add buyer commission fields
ALTER TABLE deals ADD COLUMN provvigione_compratore REAL DEFAULT NULL;
ALTER TABLE deals ADD COLUMN collaboratore_compratore TEXT DEFAULT '';

-- Add seller commission fields
ALTER TABLE deals ADD COLUMN provvigione_venditore REAL DEFAULT NULL;
ALTER TABLE deals ADD COLUMN collaboratore_venditore TEXT DEFAULT '';
