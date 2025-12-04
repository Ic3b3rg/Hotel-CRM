/// <reference types="vite/client" />

// [TYPES] Type declarations for Electron IPC API
// Definisce il tipo di window.api esposto dal preload script

import type { ElectronAPI } from '../electron/preload';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
