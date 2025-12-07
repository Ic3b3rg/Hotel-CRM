// [CONFIG] Vite configuration with Electron plugins
// Configura Vite per funzionare con Electron, gestendo sia il renderer che il main process

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Base path per Electron production (file:// protocol)
  base: './',

  plugins: [
    // Plugin React per JSX e Fast Refresh
    react(),

    // Plugin Electron per compilare main.ts e preload.ts
    electron([
      {
        // Main process entry point
        entry: 'electron/main.ts',
        onstart(args) {
          args.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              // Esternalizza moduli nativi e electron
              external: ['better-sqlite3', 'electron'],
            },
          },
        },
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
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
