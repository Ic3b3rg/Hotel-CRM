// [REPOSITORY] Tags repository
// Gestisce le operazioni CRUD per i tag

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type { Tag } from '../../../src/lib/types';

interface TagRow {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

interface CreateTagRequest {
  name: string;
  color?: string;
}

interface UpdateTagRequest {
  id: string;
  name?: string;
  color?: string;
}

export class TagsRepository extends BaseRepository<Tag, CreateTagRequest, UpdateTagRequest> {
  constructor(db: Database.Database) {
    super(db, 'tags');
  }

  getAll(): Tag[] {
    const rows = this.db.prepare(`SELECT * FROM tags ORDER BY name`).all() as TagRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getById(id: string): Tag | undefined {
    const row = this.db.prepare(`SELECT * FROM tags WHERE id = ?`).get(id) as TagRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  getByName(name: string): Tag | undefined {
    const row = this.db.prepare(`SELECT * FROM tags WHERE name = ?`).get(name) as TagRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  create(data: CreateTagRequest): Tag {
    // Verifica se esiste già
    const existing = this.getByName(data.name);
    if (existing) {
      return existing;
    }

    const id = this.generateId();
    const now = this.now();

    this.db
      .prepare(`INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`)
      .run(id, data.name, data.color || null, now);

    return this.getById(id)!;
  }

  update(data: UpdateTagRequest): Tag {
    const current = this.getById(data.id);
    if (!current) {
      throw new Error(`Tag non trovato: ${data.id}`);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }

    if (fields.length > 0) {
      values.push(data.id);
      this.db.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(data.id)!;
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM tags WHERE id = ?`).run(id);
  }

  /**
   * Ottiene tutti i tag usati dai buyer
   */
  getBuyerTags(): Tag[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT t.* FROM tags t
         JOIN buyer_tags bt ON bt.tag_id = t.id
         ORDER BY t.name`
      )
      .all() as TagRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Ottiene tutti i tag usati dalle property
   */
  getPropertyTags(): Tag[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT t.* FROM tags t
         JOIN property_tags pt ON pt.tag_id = t.id
         ORDER BY t.name`
      )
      .all() as TagRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  private mapRowToEntity(row: TagRow): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color || undefined,
    };
  }
}
