// [DATABASE] SQLite connection management
// Gestisce la connessione al database SQLite e le migrazioni

import { app } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import type Database from "better-sqlite3";

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const BetterSqlite3 = require("better-sqlite3") as typeof Database;

// [GLOBALS] Istanza del database
let db: Database.Database | null = null;

/**
 * Ottiene il percorso del file database
 * In development usa la cartella del progetto, in production usa userData
 */
function getDatabasePath(): string {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    // In development, usa la cartella del progetto
    return path.join(process.cwd(), "hotel-crm.db");
  } else {
    // In production, usa la cartella userData dell'app
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, "hotel-crm.db");
  }
}

/**
 * Ottiene il percorso della cartella allegati
 * In development usa la cartella del progetto, in production usa userData
 */
export function getAttachmentsDir(): string {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    // In development, usa la cartella del progetto
    return path.join(process.cwd(), "attachments");
  } else {
    // In production, usa la cartella userData dell'app
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, "attachments");
  }
}

/**
 * Ottiene il percorso della cartella migrazioni
 * In development usa la cartella del progetto, in production usa extraResources
 */
function getMigrationsDir(): string {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    // In development, usa la cartella del progetto (process.cwd() punta alla root)
    return path.join(process.cwd(), "electron", "database", "migrations");
  } else {
    // In production, i file sono copiati in resources/electron/database/migrations via extraResources
    return path.join(
      process.resourcesPath,
      "electron",
      "database",
      "migrations",
    );
  }
}

/**
 * Legge e esegue i file SQL di migrazione in ordine
 */
function runMigrations(database: Database.Database): void {
  const migrationsDir = getMigrationsDir();
  console.log("[Database] Cercando migrazioni in:", migrationsDir);

  // Lista delle migration da eseguire in ordine
  const migrations = [
    "001_schema.sql",
    "002_optional_seller.sql",
    "003_property_codice.sql",
    "004_property_incarico.sql",
    "005_property_regione.sql",
    "006_deal_oggetto.sql",
    "007_deal_prezzo_richiesto.sql",
    "008_property_operation_types.sql",
    "009_deal_provvigioni.sql",
    "010_deal_pagamenti.sql",
    "011_property_attachments.sql",
  ];

  for (const migrationFile of migrations) {
    const migrationPath = path.join(migrationsDir, migrationFile);

    if (!fs.existsSync(migrationPath)) {
      if (migrationFile === "001_schema.sql") {
        console.warn(
          "[Database] File migrazione base non trovato:",
          migrationPath,
        );
        createSchemaInline(database);
      }
      continue;
    }

    try {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      database.exec(sql);
      console.log(`[Database] Migrazione ${migrationFile} eseguita`);
    } catch (error) {
      // Ignora errori se la tabella esiste già o la migrazione è già stata applicata
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.includes("already exists") &&
        !errorMessage.includes("no such table: properties")
      ) {
        console.error(
          `[Database] Errore migrazione ${migrationFile}:`,
          errorMessage,
        );
      }
    }
  }

  console.log("[Database] Migrazioni completate");
}

/**
 * Crea lo schema del database inline (fallback se il file SQL non esiste)
 */
function createSchemaInline(database: Database.Database): void {
  database.exec(`
    -- SELLERS
    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT,
      contact_preference TEXT NOT NULL DEFAULT 'telefono' CHECK (contact_preference IN ('telefono', 'email')),
      preferred_hours TEXT,
      notes TEXT DEFAULT '',
      last_contact TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- PROPERTIES
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      codice TEXT DEFAULT '',
      address_street TEXT DEFAULT '',
      address_number TEXT,
      address_city TEXT DEFAULT '',
      address_cap TEXT DEFAULT '',
      address_province TEXT DEFAULT '',
      address_country TEXT DEFAULT 'Italia',
      type TEXT DEFAULT 'altro' CHECK (type IN ('hotel', 'b&b', 'affittacamere', 'residence', 'altro')),
      category TEXT DEFAULT 'n/a' CHECK (category IN ('1*', '2*', '3*', '4*', '5*', 'n/a')),
      rooms INTEGER DEFAULT 0,
      beds INTEGER DEFAULT 0,
      condition TEXT DEFAULT 'buono' CHECK (condition IN ('ottimo', 'buono', 'da_ristrutturare', 'in_costruzione')),
      price_min INTEGER DEFAULT 0,
      price_max INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
      has_incarico INTEGER DEFAULT 0,
      incarico_percentuale REAL DEFAULT NULL,
      incarico_scadenza TEXT DEFAULT NULL,
      regione TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- BUYERS
    CREATE TABLE IF NOT EXISTS buyers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      budget_min INTEGER NOT NULL DEFAULT 0,
      budget_max INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      level TEXT CHECK (level IN ('privato', 'fondo', 'gruppo_alberghiero', 'investitore')),
      notes TEXT DEFAULT '',
      last_contact TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- DEALS
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'nuovo_contatto' CHECK (status IN ('nuovo_contatto', 'in_corso', 'offerta_inviata', 'diligenza', 'chiuso_positivo', 'chiuso_negativo')),
      oggetto TEXT DEFAULT '' CHECK (oggetto IN ('', 'vendita', 'affitto', 'gestione')),
      price_offered INTEGER,
      price_negotiated INTEGER,
      prezzo_richiesto INTEGER,
      provvigione_compratore REAL DEFAULT NULL,
      collaboratore_compratore TEXT DEFAULT '',
      provvigione_venditore REAL DEFAULT NULL,
      collaboratore_venditore TEXT DEFAULT '',
      pagamento_compratore TEXT DEFAULT '' CHECK (pagamento_compratore IN ('', 'si', 'no', 'rateale')),
      acconto_compratore INTEGER DEFAULT 0,
      pagamento_venditore TEXT DEFAULT '' CHECK (pagamento_venditore IN ('', 'si', 'no', 'rateale')),
      acconto_venditore INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ACTIVITIES
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('nota', 'chiamata', 'email', 'appuntamento', 'follow_up')),
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- TAGS
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- BUYER_TAGS (many-to-many)
    CREATE TABLE IF NOT EXISTS buyer_tags (
      buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (buyer_id, tag_id)
    );

    -- PROPERTY_TAGS (many-to-many)
    CREATE TABLE IF NOT EXISTS property_tags (
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (property_id, tag_id)
    );

    -- BUYER_ZONES (buyer zones of interest)
    CREATE TABLE IF NOT EXISTS buyer_zones (
      buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
      zone TEXT NOT NULL,
      PRIMARY KEY (buyer_id, zone)
    );

    -- BUYER_PREFERRED_TYPES (buyer preferred property types)
    CREATE TABLE IF NOT EXISTS buyer_preferred_types (
      buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
      property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'b&b', 'affittacamere', 'residence', 'altro')),
      PRIMARY KEY (buyer_id, property_type)
    );

    -- PROPERTY_OPERATION_TYPES (property operation types - many-to-many)
    CREATE TABLE IF NOT EXISTS property_operation_types (
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      operation_type TEXT NOT NULL CHECK (operation_type IN ('affitto_attivita', 'vendita_attivita', 'affitto_mura', 'vendita_mura', 'vendita_cespite', 'vendita_societa')),
      PRIMARY KEY (property_id, operation_type)
    );

    -- PROPERTY_ATTACHMENTS (property file attachments)
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

    -- INDEXES
    CREATE INDEX IF NOT EXISTS idx_sellers_name ON sellers(name);
    CREATE INDEX IF NOT EXISTS idx_properties_seller ON properties(seller_id);
    CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(address_city);
    CREATE INDEX IF NOT EXISTS idx_properties_codice ON properties(codice);
    CREATE INDEX IF NOT EXISTS idx_buyers_name ON buyers(name);
    CREATE INDEX IF NOT EXISTS idx_buyers_budget ON buyers(budget_min, budget_max);
    CREATE INDEX IF NOT EXISTS idx_deals_buyer ON deals(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_deals_property ON deals(property_id);
    CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
    CREATE INDEX IF NOT EXISTS idx_deals_oggetto ON deals(oggetto);
    CREATE INDEX IF NOT EXISTS idx_deals_prezzo_richiesto ON deals(prezzo_richiesto);
    CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
    CREATE INDEX IF NOT EXISTS idx_property_operation_types_property ON property_operation_types(property_id);
    CREATE INDEX IF NOT EXISTS idx_property_operation_types_type ON property_operation_types(operation_type);
    CREATE INDEX IF NOT EXISTS idx_property_attachments_property ON property_attachments(property_id);
    CREATE INDEX IF NOT EXISTS idx_property_attachments_type ON property_attachments(file_type);
  `);
  console.log("[Database] Schema creato inline");
}

/**
 * Inizializza la connessione al database
 * @returns L'istanza del database
 */
export async function initDatabase(): Promise<Database.Database> {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  console.log("[Database] Percorso database:", dbPath);

  // Crea la cartella se non esiste
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Apri la connessione
  db = new BetterSqlite3(dbPath, {
    // Abilita foreign keys
    fileMustExist: false,
  });

  // Abilita le foreign keys
  db.pragma("foreign_keys = ON");

  // Esegui le migrazioni
  runMigrations(db);

  return db;
}

/**
 * Ottiene l'istanza del database
 * @throws Error se il database non è stato inizializzato
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error(
      "Database non inizializzato. Chiamare initDatabase() prima.",
    );
  }
  return db;
}

/**
 * Chiude la connessione al database
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log("[Database] Connessione chiusa");
  }
}
