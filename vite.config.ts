// [CONFIG] Vite configuration with Electron plugins
// Configura Vite per funzionare con Electron, gestendo sia il renderer che il main process

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    // Plugin React per JSX e Fast Refresh
    react(),

    // Plugin Electron per compilare solo main.ts
    electron([
      {
        // Main process entry point
        entry: 'electron/main.ts',
        onstart(args) {
          // Copia preload.cjs manualmente dopo il build
          const src = path.join(__dirname, 'electron/preload.cjs');
          const dest = path.join(__dirname, 'dist-electron/preload.cjs');
          fs.copyFileSync(src, dest);
          console.log('[Build] Copiato preload.cjs');
          args.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              // better-sqlite3 deve essere esternalizzato (modulo nativo)
              external: ['better-sqlite3'],
            },
          },
        },
      },
    ]),

    // Permette l'uso di API Node nel renderer (via preload)
    renderer(),
  ],

  // Alias per import puliti
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Output directory per il build del renderer
  build: {
    outDir: 'dist',
  },

  // Server di sviluppo
  server: {
    port: 5173,
    strictPort: true,
  },
});
