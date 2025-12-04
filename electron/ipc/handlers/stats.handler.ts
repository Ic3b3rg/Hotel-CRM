// [IPC-HANDLER] Stats IPC handlers
// Gestisce le chiamate IPC per le statistiche della dashboard

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { BuyersRepository } from '../../database/repositories/buyers.repository';
import { SellersRepository } from '../../database/repositories/sellers.repository';
import { PropertiesRepository } from '../../database/repositories/properties.repository';
import { DealsRepository } from '../../database/repositories/deals.repository';
import type { IPCResponse, DashboardStats, Deal } from '../../../src/lib/types';

export function registerStatsHandlers(db: Database.Database): void {
  const buyersRepo = new BuyersRepository(db);
  const sellersRepo = new SellersRepository(db);
  const propertiesRepo = new PropertiesRepository(db);
  const dealsRepo = new DealsRepository(db);

  // GET DASHBOARD STATS
  ipcMain.handle(
    IPC_CHANNELS.STATS_GET_DASHBOARD,
    async (): Promise<IPCResponse<DashboardStats>> => {
      try {
        const stats: DashboardStats = {
          totalBuyers: buyersRepo.count(),
          totalSellers: sellersRepo.count(),
          totalProperties: propertiesRepo.count(),
          activeDeals: dealsRepo.countActive(),
          closedDeals: dealsRepo.countClosed(),
          staleDeals: dealsRepo.getStaleDeals(30).length,
        };

        return { success: true, data: stats };
      } catch (error) {
        console.error('[IPC] stats:getDashboard error:', error);
        return {
          success: false,
          error: {
            code: 'STATS_GET_DASHBOARD_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET STALE DEALS (trattative ferme da X giorni)
  ipcMain.handle(
    IPC_CHANNELS.STATS_GET_STALE_DEALS,
    async (_, days?: number): Promise<IPCResponse<Deal[]>> => {
      try {
        const staleDeals = dealsRepo.getStaleDeals(days || 30);
        return { success: true, data: staleDeals };
      } catch (error) {
        console.error('[IPC] stats:getStaleDeals error:', error);
        return {
          success: false,
          error: {
            code: 'STATS_GET_STALE_DEALS_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Stats handlers registrati');
}
