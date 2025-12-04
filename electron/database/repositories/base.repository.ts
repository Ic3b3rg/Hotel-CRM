// [REPOSITORY] Base repository class
// Classe base astratta per tutti i repository con funzionalità comuni

import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(db: Database.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Genera un nuovo UUID
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Restituisce la data/ora corrente in formato ISO
   */
  protected now(): string {
    return new Date().toISOString();
  }

  /**
   * Esegue una funzione in una transazione
   */
  protected runInTransaction<R>(fn: () => R): R {
    return this.db.transaction(fn)();
  }

  /**
   * Conta i record nella tabella
   */
  count(): number {
    const result = this.db
      .prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`)
      .get() as { count: number };
    return result.count;
  }

  /**
   * Verifica se esiste un record con l'ID specificato
   */
  exists(id: string): boolean {
    const result = this.db
      .prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ?`)
      .get(id);
    return result !== undefined;
  }

  // Metodi astratti da implementare nelle sottoclassi
  abstract getAll(filters?: unknown): T[];
  abstract getById(id: string): T | undefined;
  abstract create(data: CreateDTO): T;
  abstract update(data: UpdateDTO): T;
  abstract delete(id: string): void;
}
