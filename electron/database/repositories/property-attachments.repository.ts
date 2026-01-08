// [REPOSITORY] Property Attachments repository
// Gestisce gli allegati degli immobili (PDF, Excel)

import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type { PropertyAttachment, CreatePropertyAttachmentRequest } from '../../../src/lib/types';

// Interfaccia per la riga dal database
interface PropertyAttachmentRow {
  id: string;
  property_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export class PropertyAttachmentsRepository extends BaseRepository<
  PropertyAttachment,
  CreatePropertyAttachmentRequest,
  { id: string }
> {
  constructor(db: Database.Database) {
    super(db, 'property_attachments');
  }

  /**
   * Ottiene tutti gli allegati (non usato comunemente)
   */
  getAll(): PropertyAttachment[] {
    const rows = this.db
      .prepare('SELECT * FROM property_attachments ORDER BY created_at DESC')
      .all() as PropertyAttachmentRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Ottiene tutti gli allegati di un immobile
   */
  getByPropertyId(propertyId: string): PropertyAttachment[] {
    const rows = this.db
      .prepare('SELECT * FROM property_attachments WHERE property_id = ? ORDER BY created_at DESC')
      .all(propertyId) as PropertyAttachmentRow[];
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Ottiene un allegato per ID
   */
  getById(id: string): PropertyAttachment | undefined {
    const row = this.db
      .prepare('SELECT * FROM property_attachments WHERE id = ?')
      .get(id) as PropertyAttachmentRow | undefined;
    return row ? this.mapRowToEntity(row) : undefined;
  }

  /**
   * Crea un nuovo allegato
   */
  create(data: CreatePropertyAttachmentRequest): PropertyAttachment {
    const id = this.generateId();
    const now = this.now();

    this.db
      .prepare(
        `INSERT INTO property_attachments (id, property_id, filename, original_filename, file_path, file_type, file_size, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.propertyId,
        data.filename,
        data.originalFilename,
        data.filePath,
        data.fileType || '',
        data.fileSize || 0,
        now
      );

    return this.getById(id)!;
  }

  /**
   * Aggiorna un allegato (non usato comunemente - gli allegati sono immutabili)
   */
  update(data: { id: string }): PropertyAttachment {
    // Gli allegati sono immutabili, restituiamo semplicemente l'allegato esistente
    const existing = this.getById(data.id);
    if (!existing) {
      throw new Error(`Allegato con ID ${data.id} non trovato`);
    }
    return existing;
  }

  /**
   * Elimina un allegato
   */
  delete(id: string): void {
    this.db.prepare('DELETE FROM property_attachments WHERE id = ?').run(id);
  }

  /**
   * Elimina tutti gli allegati di un immobile
   */
  deleteByPropertyId(propertyId: string): void {
    this.db.prepare('DELETE FROM property_attachments WHERE property_id = ?').run(propertyId);
  }

  /**
   * Mappa una riga del database all'entità
   */
  private mapRowToEntity(row: PropertyAttachmentRow): PropertyAttachment {
    return {
      id: row.id,
      propertyId: row.property_id,
      filename: row.filename,
      originalFilename: row.original_filename,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      createdAt: new Date(row.created_at),
    };
  }
}
