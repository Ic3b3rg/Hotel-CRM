// [IPC-HANDLER] Property Attachments IPC handlers
// Gestisce le chiamate IPC per le operazioni sugli allegati degli immobili

import { ipcMain, shell } from 'electron';
import type Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IPC_CHANNELS } from '../channels';
import { PropertyAttachmentsRepository } from '../../database/repositories/property-attachments.repository';
import { getAttachmentsDir } from '../../database/connection';
import type { IPCResponse, PropertyAttachment, CreatePropertyAttachmentRequest } from '../../../src/lib/types';

// Tipi MIME supportati
const SUPPORTED_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
};

// Dimensione massima file: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Assicura che la cartella allegati esista
 */
function ensureAttachmentsDir(propertyId: string): string {
  const attachmentsDir = getAttachmentsDir();
  const propertyDir = path.join(attachmentsDir, propertyId);

  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }
  if (!fs.existsSync(propertyDir)) {
    fs.mkdirSync(propertyDir, { recursive: true });
  }

  return propertyDir;
}

/**
 * Ottiene l'estensione del file in minuscolo
 */
function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Genera un nome file univoco mantenendo l'estensione
 */
function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const uniqueId = uuidv4().substring(0, 8);
  const baseName = path.basename(originalFilename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Sanitizza il nome
    .substring(0, 50); // Limita la lunghezza
  return `${baseName}_${uniqueId}${ext}`;
}

export function registerPropertyAttachmentsHandlers(db: Database.Database): void {
  const repository = new PropertyAttachmentsRepository(db);

  // GET BY PROPERTY
  ipcMain.handle(
    IPC_CHANNELS.PROPERTY_ATTACHMENTS_GET_BY_PROPERTY,
    async (_, propertyId: string): Promise<IPCResponse<PropertyAttachment[]>> => {
      try {
        const attachments = repository.getByPropertyId(propertyId);
        return { success: true, data: attachments };
      } catch (error) {
        console.error('[IPC] propertyAttachments:getByProperty error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTY_ATTACHMENTS_GET_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // SAVE FILE (salva il file sul disco e crea il record nel DB)
  ipcMain.handle(
    IPC_CHANNELS.PROPERTY_ATTACHMENTS_SAVE_FILE,
    async (
      _,
      data: { propertyId: string; originalFilename: string; fileData: string }
    ): Promise<IPCResponse<PropertyAttachment>> => {
      try {
        const { propertyId, originalFilename, fileData } = data;

        // Validazione
        if (!propertyId) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID immobile non specificato' },
          };
        }
        if (!originalFilename) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Nome file non specificato' },
          };
        }

        // Verifica estensione supportata
        const ext = getFileExtension(originalFilename);
        if (!SUPPORTED_TYPES[ext]) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Tipo file non supportato: ${ext}. Supportati: PDF, Excel (.xlsx, .xls)`,
            },
          };
        }

        // Decodifica il file da base64
        const fileBuffer = Buffer.from(fileData, 'base64');

        // Verifica dimensione
        if (fileBuffer.length > MAX_FILE_SIZE) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `File troppo grande. Massimo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            },
          };
        }

        // Crea la cartella e salva il file
        const propertyDir = ensureAttachmentsDir(propertyId);
        const uniqueFilename = generateUniqueFilename(originalFilename);
        const filePath = path.join(propertyDir, uniqueFilename);

        fs.writeFileSync(filePath, fileBuffer);

        // Crea il record nel database
        const attachmentData: CreatePropertyAttachmentRequest = {
          propertyId,
          filename: uniqueFilename,
          originalFilename,
          filePath,
          fileType: SUPPORTED_TYPES[ext] || '',
          fileSize: fileBuffer.length,
        };

        const attachment = repository.create(attachmentData);
        return { success: true, data: attachment };
      } catch (error) {
        console.error('[IPC] propertyAttachments:saveFile error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTY_ATTACHMENTS_SAVE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // CREATE (usato internamente, preferire SAVE_FILE dal renderer)
  ipcMain.handle(
    IPC_CHANNELS.PROPERTY_ATTACHMENTS_CREATE,
    async (_, data: CreatePropertyAttachmentRequest): Promise<IPCResponse<PropertyAttachment>> => {
      try {
        if (!data.propertyId) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'ID immobile non specificato' },
          };
        }
        if (!data.filename) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Nome file non specificato' },
          };
        }

        const attachment = repository.create(data);
        return { success: true, data: attachment };
      } catch (error) {
        console.error('[IPC] propertyAttachments:create error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTY_ATTACHMENTS_CREATE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // DELETE
  ipcMain.handle(
    IPC_CHANNELS.PROPERTY_ATTACHMENTS_DELETE,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        // Ottieni l'allegato per eliminare anche il file
        const attachment = repository.getById(id);
        if (!attachment) {
          return {
            success: false,
            error: { code: 'ATTACHMENT_NOT_FOUND', message: `Allegato non trovato: ${id}` },
          };
        }

        // Elimina il file dal disco (se esiste)
        if (fs.existsSync(attachment.filePath)) {
          fs.unlinkSync(attachment.filePath);
        }

        // Elimina il record dal database
        repository.delete(id);
        return { success: true };
      } catch (error) {
        console.error('[IPC] propertyAttachments:delete error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTY_ATTACHMENTS_DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  // OPEN (apre il file con l'applicazione predefinita)
  ipcMain.handle(
    IPC_CHANNELS.PROPERTY_ATTACHMENTS_OPEN,
    async (_, id: string): Promise<IPCResponse<void>> => {
      try {
        const attachment = repository.getById(id);
        if (!attachment) {
          return {
            success: false,
            error: { code: 'ATTACHMENT_NOT_FOUND', message: `Allegato non trovato: ${id}` },
          };
        }

        if (!fs.existsSync(attachment.filePath)) {
          return {
            success: false,
            error: { code: 'FILE_NOT_FOUND', message: 'Il file non esiste più sul disco' },
          };
        }

        // Apre il file con l'applicazione predefinita del sistema
        await shell.openPath(attachment.filePath);
        return { success: true };
      } catch (error) {
        console.error('[IPC] propertyAttachments:open error:', error);
        return {
          success: false,
          error: {
            code: 'PROPERTY_ATTACHMENTS_OPEN_ERROR',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
          },
        };
      }
    }
  );

  console.log('[IPC] Property Attachments handlers registrati');
}
