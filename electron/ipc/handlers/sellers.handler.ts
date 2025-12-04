// [IPC-HANDLER] Sellers IPC handlers
// Gestisce le chiamate IPC per le operazioni sui venditori

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { SellersRepository } from '../../database/repositories/sellers.repository';
import type { IPCResponse, Seller, SellerFilters, CreateSellerRequest, UpdateSellerRequest } from '../../../src/lib/types';

export function registerSellersHandlers(db: Database.Database): void {
  const repository = new SellersRepository(db);

  // GET ALL
  ipcMain.handle(
    IPC_CHANNELS.SELLERS_GET_ALL,
    async (_, filters?: SellerFilters): Promise<IPCResponse<Seller[]>> => {
      try {
        const sellers = repository.getAll(filters);
        return { success: true, data: sellers };
      } catch (error) {
        console.error('[IPC] sellers:getAll error:', error);
        return {
          success: false,
          error: {
            code: 'SELLERS_GET_ALL_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY ID
  ipcMain.handle(
    IPC_CHANNELS.SELLERS_GET_BY_ID,
    async (_, id: string): Promise<IPCResponse<Seller>> => {
      try {
        const seller = repository.getById(id);
        if (!seller) {
          return {
            success: false,
            error: { code: 'SELLER_NOT_FOUND', message: `Venditore non trovato: ${id}` },
          };
        }
        return { success: true, data: seller };
      } catch (error) {
        console.error('[IPC] sellers:getById error:', error);
        return {
          success: false,
          error: {
            code: 'SELLERS_GET_BY_ID_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE
  ipcMain.handle(
    IPC_CHANNELS.SELLERS_CREATE,
    async (_, data: CreateSellerRequest): Promise<IPCResponse<Seller>> => {
      try {
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

        const seller = repository.create(data);
        return { success: true, data: seller };
      } catch (error) {
        console.error('[IPC] sellers:create error:', error);
        return {
          success: false,
          error: {
            code: 'SELLERS_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // UPDATE
  ipcMain.handle(
    IPC_CHANNELS.SELLERS_UPDATE,
    async (_, data: UpdateSellerRequest): Promise<IPCResponse<Seller>> => {
      try {
        if (!data.id) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID mancante' },
          };
        }

        const seller = repository.update(data);
        return { success: true, data: seller };
      } catch (error) {
        console.error('[IPC] sellers:update error:', error);
        return {
          success: false,
          error: {
            code: 'SELLERS_UPDATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.SELLERS_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        if (!repository.exists(id)) {
          return {
            success: false,
            error: { code: 'SELLER_NOT_FOUND', message: `Venditore non trovato: ${id}` },
          };
        }

        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] sellers:delete error:', error);
        return {
          success: false,
          error: {
            code: 'SELLERS_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Sellers handlers registrati');
}
