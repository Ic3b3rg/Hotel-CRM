-- [MIGRATION] 010_deal_pagamenti.sql
-- Aggiunge campi per stato pagamenti compratore e venditore alle trattative

-- Pagamento compratore: si, no, rateale
ALTER TABLE deals ADD COLUMN pagamento_compratore TEXT DEFAULT '' CHECK (pagamento_compratore IN ('', 'si', 'no', 'rateale'));

-- Acconto compratore: boolean
ALTER TABLE deals ADD COLUMN acconto_compratore INTEGER DEFAULT 0;

-- Pagamento venditore: si, no, rateale
ALTER TABLE deals ADD COLUMN pagamento_venditore TEXT DEFAULT '' CHECK (pagamento_venditore IN ('', 'si', 'no', 'rateale'));

-- Acconto venditore: boolean
ALTER TABLE deals ADD COLUMN acconto_venditore INTEGER DEFAULT 0;
