// [IPC-HANDLER] Tags IPC handlers
// Gestisce le chiamate IPC per le operazioni sui tag

import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../channels';
import { TagsRepository } from '../../database/repositories/tags.repository';
import type { IPCResponse, Tag } from '../../../src/lib/types';

export function registerTagsHandlers(db: Database.Database): void {
  const repository = new TagsRepository(db);

  // GET ALL
  ipcMain.handle(
    IPC_CHANNELS.TAGS_GET_ALL,
    async (): Promise<IPCResponse<Tag[]>> => {
      try {
        const tags = repository.getAll();
        return { success: true, data: tags };
      } catch (error) {
        console.error('[IPC] tags:getAll error:', error);
        return {
          success: false,
          error: {
            code: 'TAGS_GET_ALL_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE
  ipcMain.handle(
    IPC_CHANNELS.TAGS_CREATE,
    async (_, { name, color }: { name: string; color?: string }): Promise<IPCResponse<Tag>> => {
      try {
        if (!name || name.trim().length === 0) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Nome tag richiesto' },
          };
        }

        const tag = repository.create({ name: name.trim(), color });
        return { success: true, data: tag };
      } catch (error) {
        console.error('[IPC] tags:create error:', error);
        return {
          success: false,
          error: {
            code: 'TAGS_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.TAGS_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        if (!repository.exists(id)) {
          return {
            success: false,
            error: { code: 'TAG_NOT_FOUND', message: `Tag non trovato: ${id}` },
          };
        }

        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] tags:delete error:', error);
        return {
          success: false,
          error: {
            code: 'TAGS_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Tags handlers registrati');
}
