// [IPC-HANDLER] Activities IPC handlers
// Gestisce le chiamate IPC per le operazioni sulle attività

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { ActivitiesRepository } from '../../database/repositories/activities.repository';
import type { IPCResponse, Activity, CreateActivityRequest } from '../../../src/lib/types';

export function registerActivitiesHandlers(db: Database.Database): void {
  const repository = new ActivitiesRepository(db);

  // GET BY DEAL
  ipcMain.handle(
    IPC_CHANNELS.ACTIVITIES_GET_BY_DEAL,
    async (_, dealId: string): Promise<IPCResponse<Activity[]>> => {
      try {
        const activities = repository.getByDeal(dealId);
        return { success: true, data: activities };
      } catch (error) {
        console.error('[IPC] activities:getByDeal error:', error);
        return {
          success: false,
          error: {
            code: 'ACTIVITIES_GET_BY_DEAL_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE
  ipcMain.handle(
    IPC_CHANNELS.ACTIVITIES_CREATE,
    async (_, data: CreateActivityRequest): Promise<IPCResponse<Activity>> => {
      try {
        if (!data.dealId) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Trattativa non specificata' },
          };
        }
        if (!data.description || data.description.trim().length === 0) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Descrizione richiesta' },
          };
        }

        const activity = repository.create(data);
        return { success: true, data: activity };
      } catch (error) {
        console.error('[IPC] activities:create error:', error);
        return {
          success: false,
          error: {
            code: 'ACTIVITIES_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.ACTIVITIES_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        if (!repository.exists(id)) {
          return {
            success: false,
            error: { code: 'ACTIVITY_NOT_FOUND', message: `Attività non trovata: ${id}` },
          };
        }

        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] activities:delete error:', error);
        return {
          success: false,
          error: {
            code: 'ACTIVITIES_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Activities handlers registrati');
}
