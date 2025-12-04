// [REPOSITORY] Sellers repository
// Gestisce le operazioni CRUD per i venditori

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type {
  Seller,
  CreateSellerRequest,
  UpdateSellerRequest,
  SellerFilters,
  ContactPreference,
} from '../../../src/lib/types';

interface SellerRow {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  role: string | null;
  contact_preference: string;
  preferred_hours: string | null;
  notes: string;
  last_contact: string | null;
  created_at: string;
  updated_at: string;
}

export class SellersRepository extends BaseRepository<Seller, CreateSellerRequest, UpdateSellerRequest> {
  constructor(db: Database.Database) {
    super(db, 'sellers');
  }

  getAll(filters?: SellerFilters): Seller[] {
    let query = `SELECT * FROM sellers WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.search) {
      query += ` AND (name LIKE ? OR company LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = this.db.prepare(query).all(...params) as SellerRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getById(id: string): Seller | undefined {
    const row = this.db.prepare(`SELECT * FROM sellers WHERE id = ?`).get(id) as SellerRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  create(data: CreateSellerRequest): Seller {
    const id = this.generateId();
    const now = this.now();

    this.db
      .prepare(
        `INSERT INTO sellers (id, name, company, email, phone, role, contact_preference, preferred_hours, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.name,
        data.company || null,
        data.email,
        data.phone,
        data.role || null,
        data.contactPreference,
        data.preferredHours || null,
        data.notes || '',
        now,
        now
      );

    return this.getById(id)!;
  }

  update(data: UpdateSellerRequest): Seller {
    const current = this.getById(data.id);
    if (!current) {
      throw new Error(`Seller non trovato: ${data.id}`);
    }

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
    if (data.role !== undefined) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (data.contactPreference !== undefined) {
      fields.push('contact_preference = ?');
      values.push(data.contactPreference);
    }
    if (data.preferredHours !== undefined) {
      fields.push('preferred_hours = ?');
      values.push(data.preferredHours);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length > 0) {
      values.push(data.id);
      this.db.prepare(`UPDATE sellers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(data.id)!;
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM sellers WHERE id = ?`).run(id);
  }

  updateLastContact(id: string): void {
    this.db.prepare(`UPDATE sellers SET last_contact = ? WHERE id = ?`).run(this.now(), id);
  }

  private mapRowToEntity(row: SellerRow): Seller {
    // Ottiene gli ID delle proprietà associate
    const properties = this.db
      .prepare(`SELECT id FROM properties WHERE seller_id = ?`)
      .all(row.id) as { id: string }[];

    return {
      id: row.id,
      name: row.name,
      company: row.company || undefined,
      email: row.email,
      phone: row.phone,
      role: row.role || undefined,
      contactPreference: row.contact_preference as ContactPreference,
      preferredHours: row.preferred_hours || undefined,
      notes: row.notes,
      propertyIds: properties.map((p) => p.id),
      lastContact: row.last_contact ? new Date(row.last_contact) : undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
