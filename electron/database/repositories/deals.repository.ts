// [REPOSITORY] Deals repository
// Gestisce le operazioni CRUD per le trattative

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type {
  Deal,
  Activity,
  CreateDealRequest,
  UpdateDealRequest,
  DealStatus,
  DealOggetto,
  PagamentoStatus,
  ActivityType,
} from '../../../src/lib/types';

interface DealRow {
  id: string;
  buyer_id: string;
  property_id: string;
  status: string;
  oggetto: string;
  prezzo_richiesto: number | null;
  price_offered: number | null;
  price_negotiated: number | null;
  provvigione_compratore: number | null;
  collaboratore_compratore: string;
  provvigione_venditore: number | null;
  collaboratore_venditore: string;
  pagamento_compratore: string;
  acconto_compratore: number;
  pagamento_venditore: string;
  acconto_venditore: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ActivityRow {
  id: string;
  deal_id: string;
  date: string;
  type: string;
  description: string;
  created_at: string;
}

export class DealsRepository extends BaseRepository<Deal, CreateDealRequest, UpdateDealRequest> {
  constructor(db: Database.Database) {
    super(db, 'deals');
  }

  getAll(): Deal[] {
    const rows = this.db
      .prepare(`SELECT * FROM deals ORDER BY updated_at DESC`)
      .all() as DealRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getById(id: string): Deal | undefined {
    const row = this.db.prepare(`SELECT * FROM deals WHERE id = ?`).get(id) as DealRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  getByBuyer(buyerId: string): Deal[] {
    const rows = this.db
      .prepare(`SELECT * FROM deals WHERE buyer_id = ? ORDER BY updated_at DESC`)
      .all(buyerId) as DealRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getByProperty(propertyId: string): Deal[] {
    const rows = this.db
      .prepare(`SELECT * FROM deals WHERE property_id = ? ORDER BY updated_at DESC`)
      .all(propertyId) as DealRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  getByStatus(status: DealStatus): Deal[] {
    const rows = this.db
      .prepare(`SELECT * FROM deals WHERE status = ? ORDER BY updated_at DESC`)
      .all(status) as DealRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Ottiene le trattative "stale" (non aggiornate da X giorni)
   */
  getStaleDeals(days: number = 30): Deal[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const rows = this.db
      .prepare(
        `SELECT * FROM deals
         WHERE status NOT IN ('chiuso_positivo', 'chiuso_negativo')
         AND updated_at < ?
         ORDER BY updated_at ASC`
      )
      .all(cutoffDate.toISOString()) as DealRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  create(data: CreateDealRequest): Deal {
    const id = this.generateId();
    const now = this.now();

    this.db
      .prepare(
        `INSERT INTO deals (id, buyer_id, property_id, status, oggetto, prezzo_richiesto, price_offered, provvigione_compratore, collaboratore_compratore, provvigione_venditore, collaboratore_venditore, pagamento_compratore, acconto_compratore, pagamento_venditore, acconto_venditore, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.buyerId,
        data.propertyId,
        data.status || 'nuovo_contatto',
        data.oggetto,
        data.prezzoRichiesto || null,
        data.priceOffered || null,
        data.provvigioneCompratore ?? null,
        data.collaboratoreCompratore || '',
        data.provvigioneVenditore ?? null,
        data.collaboratoreVenditore || '',
        data.pagamentoCompratore || '',
        data.accontoCompratore ? 1 : 0,
        data.pagamentoVenditore || '',
        data.accontoVenditore ? 1 : 0,
        data.notes || '',
        now,
        now
      );

    return this.getById(id)!;
  }

  update(data: UpdateDealRequest): Deal {
    const current = this.getById(data.id);
    if (!current) {
      throw new Error(`Deal non trovata: ${data.id}`);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.oggetto !== undefined) {
      fields.push('oggetto = ?');
      values.push(data.oggetto);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.prezzoRichiesto !== undefined) {
      fields.push('prezzo_richiesto = ?');
      values.push(data.prezzoRichiesto);
    }
    if (data.priceOffered !== undefined) {
      fields.push('price_offered = ?');
      values.push(data.priceOffered);
    }
    if (data.priceNegotiated !== undefined) {
      fields.push('price_negotiated = ?');
      values.push(data.priceNegotiated);
    }
    if (data.provvigioneCompratore !== undefined) {
      fields.push('provvigione_compratore = ?');
      values.push(data.provvigioneCompratore);
    }
    if (data.collaboratoreCompratore !== undefined) {
      fields.push('collaboratore_compratore = ?');
      values.push(data.collaboratoreCompratore);
    }
    if (data.provvigioneVenditore !== undefined) {
      fields.push('provvigione_venditore = ?');
      values.push(data.provvigioneVenditore);
    }
    if (data.collaboratoreVenditore !== undefined) {
      fields.push('collaboratore_venditore = ?');
      values.push(data.collaboratoreVenditore);
    }
    if (data.pagamentoCompratore !== undefined) {
      fields.push('pagamento_compratore = ?');
      values.push(data.pagamentoCompratore);
    }
    if (data.accontoCompratore !== undefined) {
      fields.push('acconto_compratore = ?');
      values.push(data.accontoCompratore ? 1 : 0);
    }
    if (data.pagamentoVenditore !== undefined) {
      fields.push('pagamento_venditore = ?');
      values.push(data.pagamentoVenditore);
    }
    if (data.accontoVenditore !== undefined) {
      fields.push('acconto_venditore = ?');
      values.push(data.accontoVenditore ? 1 : 0);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(this.now());
      values.push(data.id);
      this.db.prepare(`UPDATE deals SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(data.id)!;
  }

  updateStatus(id: string, status: DealStatus): Deal {
    const current = this.getById(id);
    if (!current) {
      throw new Error(`Deal non trovata: ${id}`);
    }

    this.db.prepare(`UPDATE deals SET status = ? WHERE id = ?`).run(status, id);
    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM deals WHERE id = ?`).run(id);
  }

  /**
   * Conta le trattative attive (non chiuse)
   */
  countActive(): number {
    const result = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM deals WHERE status NOT IN ('chiuso_positivo', 'chiuso_negativo')`
      )
      .get() as { count: number };
    return result.count;
  }

  /**
   * Conta le trattative chiuse
   */
  countClosed(): number {
    const result = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM deals WHERE status IN ('chiuso_positivo', 'chiuso_negativo')`
      )
      .get() as { count: number };
    return result.count;
  }

  private mapRowToEntity(row: DealRow): Deal {
    // Ottiene le attività associate
    const activityRows = this.db
      .prepare(`SELECT * FROM activities WHERE deal_id = ? ORDER BY date DESC`)
      .all(row.id) as ActivityRow[];

    const activities: Activity[] = activityRows.map((a) => ({
      id: a.id,
      date: new Date(a.date),
      type: a.type as ActivityType,
      description: a.description,
    }));

    return {
      id: row.id,
      buyerId: row.buyer_id,
      propertyId: row.property_id,
      status: row.status as DealStatus,
      oggetto: (row.oggetto || '') as DealOggetto | '',
      prezzoRichiesto: row.prezzo_richiesto || undefined,
      priceOffered: row.price_offered || undefined,
      priceNegotiated: row.price_negotiated || undefined,
      provvigioneCompratore: row.provvigione_compratore ?? undefined,
      collaboratoreCompratore: row.collaboratore_compratore || undefined,
      provvigioneVenditore: row.provvigione_venditore ?? undefined,
      collaboratoreVenditore: row.collaboratore_venditore || undefined,
      pagamentoCompratore: (row.pagamento_compratore || undefined) as PagamentoStatus | undefined,
      accontoCompratore: row.acconto_compratore === 1,
      pagamentoVenditore: (row.pagamento_venditore || undefined) as PagamentoStatus | undefined,
      accontoVenditore: row.acconto_venditore === 1,
      notes: row.notes,
      activities,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
