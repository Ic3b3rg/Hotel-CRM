// [REPOSITORY] Activities repository
// Gestisce le operazioni CRUD per le attività delle trattative

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type { Activity, CreateActivityRequest, ActivityType } from '../../../src/lib/types';

interface ActivityRow {
  id: string;
  deal_id: string;
  date: string;
  type: string;
  description: string;
  created_at: string;
}

// UpdateActivityRequest non è definito nel piano, ma lo aggiungiamo per consistenza
interface UpdateActivityRequest {
  id: string;
  date?: string;
  type?: ActivityType;
  description?: string;
}

export class ActivitiesRepository extends BaseRepository<Activity, CreateActivityRequest, UpdateActivityRequest> {
  constructor(db: Database.Database) {
    super(db, 'activities');
  }

  getAll(): Activity[] {
    const rows = this.db
      .prepare(`SELECT * FROM activities ORDER BY date DESC`)
      .all() as ActivityRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getById(id: string): Activity | undefined {
    const row = this.db.prepare(`SELECT * FROM activities WHERE id = ?`).get(id) as
      | ActivityRow
      | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  getByDeal(dealId: string): Activity[] {
    const rows = this.db
      .prepare(`SELECT * FROM activities WHERE deal_id = ? ORDER BY date DESC`)
      .all(dealId) as ActivityRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Ottiene le attività recenti (ultimi X giorni)
   */
  getRecent(days: number = 7, limit: number = 10): Activity[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const rows = this.db
      .prepare(
        `SELECT * FROM activities
         WHERE date >= ?
         ORDER BY date DESC
         LIMIT ?`
      )
      .all(cutoffDate.toISOString(), limit) as ActivityRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  create(data: CreateActivityRequest): Activity {
    const id = this.generateId();
    const now = this.now();

    this.db
      .prepare(
        `INSERT INTO activities (id, deal_id, date, type, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, data.dealId, data.date, data.type, data.description, now);

    // Aggiorna updated_at della deal associata
    this.db.prepare(`UPDATE deals SET updated_at = ? WHERE id = ?`).run(now, data.dealId);

    return this.getById(id)!;
  }

  update(data: UpdateActivityRequest): Activity {
    const current = this.getById(data.id);
    if (!current) {
      throw new Error(`Activity non trovata: ${data.id}`);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.date !== undefined) {
      fields.push('date = ?');
      values.push(data.date);
    }
    if (data.type !== undefined) {
      fields.push('type = ?');
      values.push(data.type);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (fields.length > 0) {
      values.push(data.id);
      this.db.prepare(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(data.id)!;
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM activities WHERE id = ?`).run(id);
  }

  private mapRowToEntity(row: ActivityRow): Activity {
    return {
      id: row.id,
      date: new Date(row.date),
      type: row.type as ActivityType,
      description: row.description,
    };
  }
}
