// [IPC-HANDLER] Properties IPC handlers
// Gestisce le chiamate IPC per le operazioni sugli immobili

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { PropertiesRepository } from '../../database/repositories/properties.repository';
import type { IPCResponse, Property, PropertyFilters, CreatePropertyRequest, UpdatePropertyRequest } from '../../../src/lib/types';

export function registerPropertiesHandlers(db: Database.Database): void {
  const repository = new PropertiesRepository(db);

  // GET ALL
  ipcMain.handle(
    IPC_CHANNELS.PROPERTIES_GET_ALL,
    async (_, filters?: PropertyFilters): Promise<IPCResponse<Property[]>> => {
      try {
        const properties = repository.getAll(filters);
        return { success: true, data: properties };
      } catch (error) {
        console.error('[IPC] properties:getAll error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTIES_GET_ALL_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY ID
  ipcMain.handle(
    IPC_CHANNELS.PROPERTIES_GET_BY_ID,
    async (_, id: string): Promise<IPCResponse<Property>> => {
      try {
        const property = repository.getById(id);
        if (!property) {
          return {
            success: false,
            error: { code: 'PROPERTY_NOT_FOUND', message: `Immobile non trovato: ${id}` },
          };
        }
        return { success: true, data: property };
      } catch (error) {
        console.error('[IPC] properties:getById error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTIES_GET_BY_ID_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // GET BY SELLER
  ipcMain.handle(
    IPC_CHANNELS.PROPERTIES_GET_BY_SELLER,
    async (_, sellerId: string): Promise<IPCResponse<Property[]>> => {
      try {
        const properties = repository.getBySeller(sellerId);
        return { success: true, data: properties };
      } catch (error) {
        console.error('[IPC] properties:getBySeller error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTIES_GET_BY_SELLER_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE
  ipcMain.handle(
    IPC_CHANNELS.PROPERTIES_CREATE,
    async (_, data: CreatePropertyRequest): Promise<IPCResponse<Property>> => {
      try {
        if (!data.name || data.name.trim().length < 2) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Nome non valido (min 2 caratteri)' },
          };
        }
        if (!data.sellerId) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Venditore non specificato' },
          };
        }
        if (data.priceMin != null && data.priceMax != null && data.priceMax < data.priceMin) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Prezzo massimo deve essere >= prezzo minimo' },
          };
        }

        const property = repository.create(data);
        return { success: true, data: property };
      } catch (error) {
        console.error('[IPC] properties:create error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTIES_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // UPDATE
  ipcMain.handle(
    IPC_CHANNELS.PROPERTIES_UPDATE,
    async (_, data: UpdatePropertyRequest): Promise<IPCResponse<Property>> => {
      try {
        if (!data.id) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID mancante' },
          };
        }

        const property = repository.update(data);
        return { success: true, data: property };
      } catch (error) {
        console.error('[IPC] properties:update error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTIES_UPDATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.PROPERTIES_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        if (!repository.exists(id)) {
          return {
            success: false,
            error: { code: 'PROPERTY_NOT_FOUND', message: `Immobile non trovato: ${id}` },
          };
        }

        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] properties:delete error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTIES_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Properties handlers registrati');
}
