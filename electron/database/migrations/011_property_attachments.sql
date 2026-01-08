-- [MIGRATION] 011_property_attachments.sql
-- Aggiunge tabella per allegati immobili (Excel, PDF)
-- Versione: 1.0.0
-- Data: 2026-01-08

-- Tabella allegati immobili
CREATE TABLE IF NOT EXISTS property_attachments (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  file_size INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indici per ricerche efficienti
CREATE INDEX IF NOT EXISTS idx_property_attachments_property ON property_attachments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_attachments_type ON property_attachments(file_type);
