// [REPOSITORY] Properties repository
// Gestisce le operazioni CRUD per gli immobili

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type {
  Property,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyFilters,
  PropertyType,
  PropertyCategory,
  PropertyCondition,
} from '../../../src/lib/types';

interface PropertyRow {
  id: string;
  name: string;
  address_street: string;
  address_number: string | null;
  address_city: string;
  address_cap: string;
  address_province: string;
  address_country: string;
  type: string;
  category: string;
  rooms: number;
  beds: number;
  condition: string;
  price_min: number;
  price_max: number;
  notes: string;
  seller_id: string | null;  // Ora nullable
  created_at: string;
  updated_at: string;
}

export class PropertiesRepository extends BaseRepository<Property, CreatePropertyRequest, UpdatePropertyRequest> {
  constructor(db: Database.Database) {
    super(db, 'properties');
  }

  getAll(filters?: PropertyFilters): Property[] {
    let query = `SELECT * FROM properties WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.search) {
      query += ` AND (name LIKE ? OR address_city LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.city) {
      query += ` AND address_city = ?`;
      params.push(filters.city);
    }

    if (filters?.type) {
      query += ` AND type = ?`;
      params.push(filters.type);
    }

    if (filters?.condition) {
      query += ` AND condition = ?`;
      params.push(filters.condition);
    }

    if (filters?.minPrice !== undefined) {
      query += ` AND price_max >= ?`;
      params.push(filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query += ` AND price_min <= ?`;
      params.push(filters.maxPrice);
    }

    if (filters?.sellerId) {
      query += ` AND seller_id = ?`;
      params.push(filters.sellerId);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = this.db.prepare(query).all(...params) as PropertyRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getById(id: string): Property | undefined {
    const row = this.db.prepare(`SELECT * FROM properties WHERE id = ?`).get(id) as PropertyRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  getBySeller(sellerId: string): Property[] {
    const rows = this.db
      .prepare(`SELECT * FROM properties WHERE seller_id = ? ORDER BY created_at DESC`)
      .all(sellerId) as PropertyRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  create(data: CreatePropertyRequest): Property {
    const id = this.generateId();
    const now = this.now();

    // Valori di default per campi opzionali
    const address = {
      street: data.address?.street || '',
      number: data.address?.number || '',
      city: data.address?.city || '',
      cap: data.address?.cap || '',
      province: data.address?.province || '',
      country: data.address?.country || 'Italia',
    };
    const type = data.type || 'altro';
    const category = data.category || 'n/a';
    const rooms = data.rooms ?? 0;
    const beds = data.beds ?? 0;
    const condition = data.condition || 'buono';
    const priceMin = data.priceMin ?? 0;
    const priceMax = data.priceMax ?? 0;
    const tags = data.tags || [];

    return this.runInTransaction(() => {
      this.db
        .prepare(
          `INSERT INTO properties (id, name, address_street, address_number, address_city, address_cap, address_province, address_country, type, category, rooms, beds, condition, price_min, price_max, notes, seller_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          data.name,
          address.street,
          address.number || null,
          address.city,
          address.cap,
          address.province,
          address.country,
          type,
          category,
          rooms,
          beds,
          condition,
          priceMin,
          priceMax,
          data.notes || '',
          data.sellerId || null,  // seller_id ora può essere null
          now,
          now
        );

      // Inserisce i tag se presenti
      for (const tagName of tags) {
        this.linkTag(id, tagName);
      }

      return this.getById(id)!;
    });
  }

  update(data: UpdatePropertyRequest): Property {
    return this.runInTransaction(() => {
      const current = this.getById(data.id);
      if (!current) {
        throw new Error(`Property non trovata: ${data.id}`);
      }

      const fields: string[] = [];
      const values: unknown[] = [];

      if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
      }
      if (data.address !== undefined) {
        fields.push('address_street = ?', 'address_number = ?', 'address_city = ?', 'address_cap = ?', 'address_province = ?', 'address_country = ?');
        values.push(
          data.address.street,
          data.address.number || null,
          data.address.city,
          data.address.cap,
          data.address.province,
          data.address.country
        );
      }
      if (data.type !== undefined) {
        fields.push('type = ?');
        values.push(data.type);
      }
      if (data.category !== undefined) {
        fields.push('category = ?');
        values.push(data.category);
      }
      if (data.rooms !== undefined) {
        fields.push('rooms = ?');
        values.push(data.rooms);
      }
      if (data.beds !== undefined) {
        fields.push('beds = ?');
        values.push(data.beds);
      }
      if (data.condition !== undefined) {
        fields.push('condition = ?');
        values.push(data.condition);
      }
      if (data.priceMin !== undefined) {
        fields.push('price_min = ?');
        values.push(data.priceMin);
      }
      if (data.priceMax !== undefined) {
        fields.push('price_max = ?');
        values.push(data.priceMax);
      }
      if (data.notes !== undefined) {
        fields.push('notes = ?');
        values.push(data.notes);
      }

      if (fields.length > 0) {
        values.push(data.id);
        this.db.prepare(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      }

      // Aggiorna i tag se forniti
      if (data.tags) {
        this.db.prepare(`DELETE FROM property_tags WHERE property_id = ?`).run(data.id);
        for (const tagName of data.tags) {
          this.linkTag(data.id, tagName);
        }
      }

      return this.getById(data.id)!;
    });
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM properties WHERE id = ?`).run(id);
  }

  /**
   * Ottiene tutte le città uniche
   */
  getCities(): string[] {
    const rows = this.db
      .prepare(`SELECT DISTINCT address_city FROM properties ORDER BY address_city`)
      .all() as { address_city: string }[];
    return rows.map((r) => r.address_city);
  }

  private linkTag(propertyId: string, tagName: string): void {
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

    this.db
      .prepare(`INSERT OR IGNORE INTO property_tags (property_id, tag_id) VALUES (?, ?)`)
      .run(propertyId, tag.id);
  }

  private mapRowToEntity(row: PropertyRow): Property {
    const tags = this.db
      .prepare(
        `SELECT t.name FROM tags t
         JOIN property_tags pt ON pt.tag_id = t.id
         WHERE pt.property_id = ?`
      )
      .all(row.id) as { name: string }[];

    return {
      id: row.id,
      name: row.name,
      address: {
        street: row.address_street || '',
        number: row.address_number || '',
        city: row.address_city || '',
        cap: row.address_cap || '',
        province: row.address_province || '',
        country: row.address_country || 'Italia',
      },
      type: (row.type as PropertyType) || 'altro',
      category: (row.category as PropertyCategory) || 'n/a',
      rooms: row.rooms || 0,
      beds: row.beds || 0,
      condition: (row.condition as PropertyCondition) || 'buono',
      priceMin: row.price_min || 0,
      priceMax: row.price_max || 0,
      tags: tags.map((t) => t.name),
      notes: row.notes || '',
      sellerId: row.seller_id || '',  // Stringa vuota se null
      createdAt: new Date(row.created_at),
    };
  }
}
