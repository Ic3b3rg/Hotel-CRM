// [REPOSITORY] Buyers repository
// Gestisce le operazioni CRUD per i compratori

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type {
  Buyer,
  CreateBuyerRequest,
  UpdateBuyerRequest,
  BuyerFilters,
  PropertyType,
  BuyerLevel,
} from '../../../src/lib/types';

// Tipo per la riga del database
interface BuyerRow {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  level: string | null;
  notes: string;
  last_contact: string | null;
  created_at: string;
  updated_at: string;
}

export class BuyersRepository extends BaseRepository<Buyer, CreateBuyerRequest, UpdateBuyerRequest> {
  constructor(db: Database.Database) {
    super(db, 'buyers');
  }

  /**
   * Ottiene tutti i compratori con filtri opzionali
   */
  getAll(filters?: BuyerFilters): Buyer[] {
    let query = `SELECT * FROM buyers WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.search) {
      query += ` AND (name LIKE ? OR company LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.level) {
      query += ` AND level = ?`;
      params.push(filters.level);
    }

    if (filters?.minBudget !== undefined) {
      query += ` AND budget_max >= ?`;
      params.push(filters.minBudget);
    }

    if (filters?.maxBudget !== undefined) {
      query += ` AND budget_min <= ?`;
      params.push(filters.maxBudget);
    }

    if (filters?.zone) {
      query += ` AND id IN (SELECT buyer_id FROM buyer_zones WHERE zone = ?)`;
      params.push(filters.zone);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = this.db.prepare(query).all(...params) as BuyerRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Ottiene un compratore per ID
   */
  getById(id: string): Buyer | undefined {
    const row = this.db.prepare(`SELECT * FROM buyers WHERE id = ?`).get(id) as BuyerRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  /**
   * Crea un nuovo compratore
   */
  create(data: CreateBuyerRequest): Buyer {
    const id = this.generateId();
    const now = this.now();

    return this.runInTransaction(() => {
      // Inserisce il buyer
      this.db
        .prepare(
          `INSERT INTO buyers (id, name, company, email, phone, budget_min, budget_max, currency, level, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          data.name,
          data.company || null,
          data.email,
          data.phone,
          data.budgetMin,
          data.budgetMax,
          data.currency || 'EUR',
          data.level || null,
          data.notes || '',
          now,
          now
        );

      // Inserisce le zone
      const insertZone = this.db.prepare(`INSERT INTO buyer_zones (buyer_id, zone) VALUES (?, ?)`);
      for (const zone of data.zones) {
        insertZone.run(id, zone);
      }

      // Inserisce i tipi preferiti
      const insertType = this.db.prepare(
        `INSERT INTO buyer_preferred_types (buyer_id, property_type) VALUES (?, ?)`
      );
      for (const type of data.preferredTypes) {
        insertType.run(id, type);
      }

      // Inserisce/collega i tag
      for (const tagName of data.tags) {
        this.linkTag(id, tagName);
      }

      return this.getById(id)!;
    });
  }

  /**
   * Aggiorna un compratore esistente
   */
  update(data: UpdateBuyerRequest): Buyer {
    return this.runInTransaction(() => {
      const current = this.getById(data.id);
      if (!current) {
        throw new Error(`Buyer non trovato: ${data.id}`);
      }

      // Costruisce la query di update dinamicamente
      const fields: string[] = [];
      const values: unknown[] = [];

      if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
      }
      if (data.company !== undefined) {
        fields.push('company = ?');
        values.push(data.company);
      }
      if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
      }
      if (data.phone !== undefined) {
        fields.push('phone = ?');
        values.push(data.phone);
      }
      if (data.budgetMin !== undefined) {
        fields.push('budget_min = ?');
        values.push(data.budgetMin);
      }
      if (data.budgetMax !== undefined) {
        fields.push('budget_max = ?');
        values.push(data.budgetMax);
      }
      if (data.level !== undefined) {
        fields.push('level = ?');
        values.push(data.level);
      }
      if (data.notes !== undefined) {
        fields.push('notes = ?');
        values.push(data.notes);
      }

      if (fields.length > 0) {
        values.push(data.id);
        this.db.prepare(`UPDATE buyers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      }

      // Aggiorna le zone se fornite
      if (data.zones) {
        this.db.prepare(`DELETE FROM buyer_zones WHERE buyer_id = ?`).run(data.id);
        const insertZone = this.db.prepare(`INSERT INTO buyer_zones (buyer_id, zone) VALUES (?, ?)`);
        for (const zone of data.zones) {
          insertZone.run(data.id, zone);
        }
      }

      // Aggiorna i tipi preferiti se forniti
      if (data.preferredTypes) {
        this.db.prepare(`DELETE FROM buyer_preferred_types WHERE buyer_id = ?`).run(data.id);
        const insertType = this.db.prepare(
          `INSERT INTO buyer_preferred_types (buyer_id, property_type) VALUES (?, ?)`
        );
        for (const type of data.preferredTypes) {
          insertType.run(data.id, type);
        }
      }

      // Aggiorna i tag se forniti
      if (data.tags) {
        this.db.prepare(`DELETE FROM buyer_tags WHERE buyer_id = ?`).run(data.id);
        for (const tagName of data.tags) {
          this.linkTag(data.id, tagName);
        }
      }

      return this.getById(data.id)!;
    });
  }

  /**
   * Elimina un compratore
   */
  delete(id: string): void {
    this.db.prepare(`DELETE FROM buyers WHERE id = ?`).run(id);
  }

  /**
   * Aggiorna la data dell'ultimo contatto
   */
  updateLastContact(id: string): void {
    this.db.prepare(`UPDATE buyers SET last_contact = ? WHERE id = ?`).run(this.now(), id);
  }

  /**
   * Collega un tag a un buyer (crea il tag se non esiste)
   */
  private linkTag(buyerId: string, tagName: string): void {
    // Trova o crea il tag
    let tag = this.db.prepare(`SELECT id FROM tags WHERE name = ?`).get(tagName) as
      | { id: string }
      | undefined;

    if (!tag) {
      const tagId = this.generateId();
      this.db
        .prepare(`INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)`)
        .run(tagId, tagName, this.now());
      tag = { id: tagId };
    }

    // Collega il tag al buyer
    this.db
      .prepare(`INSERT OR IGNORE INTO buyer_tags (buyer_id, tag_id) VALUES (?, ?)`)
      .run(buyerId, tag.id);
  }

  /**
   * Mappa una riga del database all'entità Buyer
   */
  private mapRowToEntity(row: BuyerRow): Buyer {
    // Ottiene le zone
    const zones = this.db
      .prepare(`SELECT zone FROM buyer_zones WHERE buyer_id = ?`)
      .all(row.id) as { zone: string }[];

    // Ottiene i tipi preferiti
    const types = this.db
      .prepare(`SELECT property_type FROM buyer_preferred_types WHERE buyer_id = ?`)
      .all(row.id) as { property_type: PropertyType }[];

    // Ottiene i tag
    const tags = this.db
      .prepare(
        `SELECT t.name FROM tags t
         JOIN buyer_tags bt ON bt.tag_id = t.id
         WHERE bt.buyer_id = ?`
      )
      .all(row.id) as { name: string }[];

    return {
      id: row.id,
      name: row.name,
      company: row.company || undefined,
      email: row.email,
      phone: row.phone,
      budgetMin: row.budget_min,
      budgetMax: row.budget_max,
      currency: row.currency,
      zones: zones.map((z) => z.zone),
      preferredTypes: types.map((t) => t.property_type),
      level: (row.level as BuyerLevel) || undefined,
      tags: tags.map((t) => t.name),
      notes: row.notes,
      lastContact: row.last_contact ? new Date(row.last_contact) : undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
