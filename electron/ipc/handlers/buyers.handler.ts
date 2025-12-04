// [IPC-HANDLER] Buyers IPC handlers
// Gestisce le chiamate IPC per le operazioni sui compratori

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { BuyersRepository } from '../../database/repositories/buyers.repository';
import type { IPCResponse, Buyer, BuyerFilters, CreateBuyerRequest, UpdateBuyerRequest } from '../../../src/lib/types';

export function registerBuyersHandlers(db: Database.Database): void {
  const repository = new BuyersRepository(db);

  // GET ALL
  ipcMain.handle(
    IPC_CHANNELS.BUYERS_GET_ALL,
    async (_, filters?: BuyerFilters): Promise<IPCResponse<Buyer[]>> => {
      try {
        const buyers = repository.getAll(filters);
        return { success: true, data: buyers };
      } catch (error) {
        console.error('[IPC] buyers:getAll error:', error);
        return {
          success: false,
          error: {
            code: 'BUYERS_GET_ALL_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY ID
  ipcMain.handle(
    IPC_CHANNELS.BUYERS_GET_BY_ID,
    async (_, id: string): Promise<IPCResponse<Buyer>> => {
      try {
        const buyer = repository.getById(id);
        if (!buyer) {
          return {
            success: false,
            error: { code: 'BUYER_NOT_FOUND', message: `Compratore non trovato: ${id}` },
          };
        }
        return { success: true, data: buyer };
      } catch (error) {
        console.error('[IPC] buyers:getById error:', error);
        return {
          success: false,
          error: {
            code: 'BUYERS_GET_BY_ID_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE
  ipcMain.handle(
    IPC_CHANNELS.BUYERS_CREATE,
    async (_, data: CreateBuyerRequest): Promise<IPCResponse<Buyer>> => {
      try {
        // Validazione base
        if (!data.name || data.name.trim().length < 2) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Nome non valido (min 2 caratteri)' },
          };
        }
        if (!data.email || !data.email.includes('@')) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Email non valida' },
          };
        }
        if (data.budgetMax < data.budgetMin) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Budget massimo deve essere >= budget minimo' },
          };
        }

        const buyer = repository.create(data);
        return { success: true, data: buyer };
      } catch (error) {
        console.error('[IPC] buyers:create error:', error);
        return {
          success: false,
          error: {
            code: 'BUYERS_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // UPDATE
  ipcMain.handle(
    IPC_CHANNELS.BUYERS_UPDATE,
    async (_, data: UpdateBuyerRequest): Promise<IPCResponse<Buyer>> => {
      try {
        if (!data.id) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID mancante' },
          };
        }

        const buyer = repository.update(data);
        return { success: true, data: buyer };
      } catch (error) {
        console.error('[IPC] buyers:update error:', error);
        return {
          success: false,
          error: {
            code: 'BUYERS_UPDATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.BUYERS_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        if (!repository.exists(id)) {
          return {
            success: false,
            error: { code: 'BUYER_NOT_FOUND', message: `Compratore non trovato: ${id}` },
          };
        }

        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] buyers:delete error:', error);
        return {
          success: false,
          error: {
            code: 'BUYERS_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Buyers handlers registrati');
}
