// [IPC-HANDLER] Deals IPC handlers
// Gestisce le chiamate IPC per le operazioni sulle trattative

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { DealsRepository } from '../../database/repositories/deals.repository';
import type { IPCResponse, Deal, CreateDealRequest, UpdateDealRequest, DealStatus } from '../../../src/lib/types';

export function registerDealsHandlers(db: Database.Database): void {
  const repository = new DealsRepository(db);

  // GET ALL
  ipcMain.handle(
    IPC_CHANNELS.DEALS_GET_ALL,
    async (): Promise<IPCResponse<Deal[]>> => {
      try {
        const deals = repository.getAll();
        return { success: true, data: deals };
      } catch (error) {
        console.error('[IPC] deals:getAll error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_GET_ALL_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY ID
  ipcMain.handle(
    IPC_CHANNELS.DEALS_GET_BY_ID,
    async (_, id: string): Promise<IPCResponse<Deal>> => {
      try {
        const deal = repository.getById(id);
        if (!deal) {
          return {
            success: false,
            error: { code: 'DEAL_NOT_FOUND', message: `Trattativa non trovata: ${id}` },
          };
        }
        return { success: true, data: deal };
      } catch (error) {
        console.error('[IPC] deals:getById error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_GET_BY_ID_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY BUYER
  ipcMain.handle(
    IPC_CHANNELS.DEALS_GET_BY_BUYER,
    async (_, buyerId: string): Promise<IPCResponse<Deal[]>> => {
      try {
        const deals = repository.getByBuyer(buyerId);
        return { success: true, data: deals };
      } catch (error) {
        console.error('[IPC] deals:getByBuyer error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_GET_BY_BUYER_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY PROPERTY
  ipcMain.handle(
    IPC_CHANNELS.DEALS_GET_BY_PROPERTY,
    async (_, propertyId: string): Promise<IPCResponse<Deal[]>> => {
      try {
        const deals = repository.getByProperty(propertyId);
        return { success: true, data: deals };
      } catch (error) {
        console.error('[IPC] deals:getByProperty error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_GET_BY_PROPERTY_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE
  ipcMain.handle(
    IPC_CHANNELS.DEALS_CREATE,
    async (_, data: CreateDealRequest): Promise<IPCResponse<Deal>> => {
      try {
        if (!data.buyerId) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Compratore non specificato' },
          };
        }
        if (!data.propertyId) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Immobile non specificato' },
          };
        }

        const deal = repository.create(data);
        return { success: true, data: deal };
      } catch (error) {
        console.error('[IPC] deals:create error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // UPDATE
  ipcMain.handle(
    IPC_CHANNELS.DEALS_UPDATE,
    async (_, data: UpdateDealRequest): Promise<IPCResponse<Deal>> => {
      try {
        if (!data.id) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID mancante' },
          };
        }

        const deal = repository.update(data);
        return { success: true, data: deal };
      } catch (error) {
        console.error('[IPC] deals:update error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_UPDATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // UPDATE STATUS (shortcut per cambio status rapido, es. drag & drop Kanban)
  ipcMain.handle(
    IPC_CHANNELS.DEALS_UPDATE_STATUS,
    async (_, { id, status }: { id: string; status: DealStatus }): Promise<IPCResponse<Deal>> => {
      try {
        if (!id) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID mancante' },
          };
        }
        if (!status) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Status mancante' },
          };
        }

        const deal = repository.updateStatus(id, status);
        return { success: true, data: deal };
      } catch (error) {
        console.error('[IPC] deals:updateStatus error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_UPDATE_STATUS_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.DEALS_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        if (!repository.exists(id)) {
          return {
            success: false,
            error: { code: 'DEAL_NOT_FOUND', message: `Trattativa non trovata: ${id}` },
          };
        }

        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] deals:delete error:', error);
        return {
          success: false,
          error: {
            code: 'DEALS_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Deals handlers registrati');
}
