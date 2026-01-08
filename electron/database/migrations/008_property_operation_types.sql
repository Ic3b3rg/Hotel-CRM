-- [MIGRATION] 008_property_operation_types.sql
-- Aggiunge tabella per i tipi di operazione degli immobili (many-to-many)
-- Opzioni: affitto_attivita, vendita_attivita, affitto_mura, vendita_mura, vendita_cespite, vendita_societa
-- Versione: 1.0.0
-- Data: 2026-01-08

-- Tabella per i tipi di operazione degli immobili (many-to-many)
CREATE TABLE IF NOT EXISTS property_operation_types (
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'affitto_attivita',
        'vendita_attivita',
        'affitto_mura',
        'vendita_mura',
        'vendita_cespite',
        'vendita_societa'
    )),
    PRIMARY KEY (property_id, operation_type)
);

-- Indici per query efficienti
CREATE INDEX IF NOT EXISTS idx_property_operation_types_property ON property_operation_types(property_id);
CREATE INDEX IF NOT EXISTS idx_property_operation_types_type ON property_operation_types(operation_type);
