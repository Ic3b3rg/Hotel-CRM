// [IPC] Central IPC handler registration
// Registra tutti gli handler IPC per le varie entità

import type Database from 'better-sqlite3';
import { registerBuyersHandlers } from './handlers/buyers.handler';
import { registerSellersHandlers } from './handlers/sellers.handler';
import { registerPropertiesHandlers } from './handlers/properties.handler';
import { registerDealsHandlers } from './handlers/deals.handler';
import { registerActivitiesHandlers } from './handlers/activities.handler';
import { registerTagsHandlers } from './handlers/tags.handler';
import { registerStatsHandlers } from './handlers/stats.handler';
import { registerPropertyAttachmentsHandlers } from './handlers/property-attachments.handler';

/**
 * Registra tutti gli handler IPC con il database
 * @param db - Istanza del database SQLite
 */
export function registerIpcHandlers(db: Database.Database): void {
  // Registra handler per ogni dominio
  registerBuyersHandlers(db);
  registerSellersHandlers(db);
  registerPropertiesHandlers(db);
  registerDealsHandlers(db);
  registerActivitiesHandlers(db);
  registerTagsHandlers(db);
  registerStatsHandlers(db);
  registerPropertyAttachmentsHandlers(db);

  console.log('[IPC] Tutti gli handler registrati');
}
