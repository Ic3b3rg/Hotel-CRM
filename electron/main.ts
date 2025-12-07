// [MAIN] Electron main process entry point
// Gestisce la creazione della finestra, il lifecycle dell'app e l'inizializzazione del database

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from './database/connection';
import { registerIpcHandlers } from './ipc/index';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// [GLOBALS] Riferimento alla finestra principale
let mainWindow: BrowserWindow | null = null;

// [ENV] Determina se siamo in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// [WINDOW] Crea la finestra principale dell'applicazione
function createWindow() {
  // Verifica che il preload esista
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[Main] Preload path:', preloadPath);
  console.log('[Main] Preload exists:', fs.existsSync(preloadPath));
  console.log('[Main] __dirname:', __dirname);
  console.log('[Main] app.isPackaged:', app.isPackaged);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    // Stile della barra del titolo per macOS
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // Sfondo durante il caricamento
    backgroundColor: '#f5f5f4',
    // Mostra la finestra quando pronta
    show: false,
  });

  // [READY] Mostra la finestra quando il contenuto è caricato
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // [LOAD] Carica l'applicazione
  if (isDev) {
    // In development, carica dal server Vite
    mainWindow.loadURL('http://localhost:5173');
    // Apri DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, carica i file buildati
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // [CLOSE] Gestisce la chiusura della finestra
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// [LIFECYCLE] Inizializzazione dell'applicazione
app.whenReady().then(async () => {
  try {
    // [DB] Inizializza il database SQLite
    console.log('[Main] Inizializzazione database...');
    const db = await initDatabase();
    console.log('[Main] Database inizializzato con successo');

    // [IPC] Registra gli handler IPC
    console.log('[Main] Registrazione handler IPC...');
    registerIpcHandlers(db);
    console.log('[Main] Handler IPC registrati');

    // [WINDOW] Crea la finestra principale
    createWindow();

    // [ACTIVATE] Gestisce l'attivazione su macOS
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('[Main] Errore durante l\'inizializzazione:', error);
    app.quit();
  }
});

// [QUIT] Chiude tutte le finestre su piattaforme non-macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// [CLEANUP] Chiude il database quando l'app termina
app.on('before-quit', () => {
  console.log('[Main] Chiusura database...');
  closeDatabase();
});

// [SECURITY] Previene la creazione di nuove finestre
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
