# HotelCRM Desktop

CRM desktop per compravendite alberghiere - Applicazione completamente offline con database SQLite locale.

## Requisiti

- Node.js 20+
- npm 10+

## Installazione

```bash
cd hotel-crm-electron
npm install
```

## Sviluppo

Avvia l'applicazione in modalità sviluppo con hot-reload:

```bash
npm run dev:electron
```

Solo il renderer (senza Electron):

```bash
npm run dev
```

## Build Produzione

### macOS

```bash
npm run build:mac
```

Genera:
- `release/HotelCRM-*.dmg` (installer)
- `release/HotelCRM-*.zip` (archivio)

### Windows

```bash
npm run build:win
```

Genera:
- `release/HotelCRM Setup *.exe` (installer NSIS)
- `release/HotelCRM *.exe` (portable)

### Tutti i target

```bash
npm run build
```

## Struttura Progetto

```
hotel-crm-electron/
├── electron/                  # Processo Main Electron
│   ├── main.ts               # Entry point
│   ├── preload.ts            # Bridge sicuro per IPC
│   ├── database/             # Layer SQLite
│   │   ├── connection.ts     # Gestione connessione
│   │   ├── migrations/       # Schema SQL
│   │   └── repositories/     # CRUD per ogni entità
│   └── ipc/                  # Handler IPC
│       ├── channels.ts       # Costanti canali
│       └── handlers/         # Handler per entità
│
├── src/                      # Renderer React
│   ├── main.tsx             # Entry point React
│   ├── App.tsx              # Router principale
│   ├── routes/              # Pagine
│   ├── components/          # Componenti UI
│   ├── hooks/               # Hook per IPC
│   └── lib/                 # Utilities e tipi
│
└── resources/               # Risorse per build
    ├── icon.png             # Icona Linux/web
    ├── icon.icns            # Icona macOS
    └── icon.ico             # Icona Windows
```

## Icone

Prima del build, aggiungi le icone nella cartella `resources/`:

- `icon.png` - 512x512 o 1024x1024 pixel (Linux, web)
- `icon.icns` - Formato macOS (usa `iconutil` o app come Image2Icon)
- `icon.ico` - Formato Windows (256x256)

## Database

Il database SQLite viene creato automaticamente in:

- **macOS**: `~/Library/Application Support/hotel-crm-desktop/hotel-crm.db`
- **Windows**: `%APPDATA%/hotel-crm-desktop/hotel-crm.db`
- **Linux**: `~/.config/hotel-crm-desktop/hotel-crm.db`

## Architettura

L'app usa un'architettura sicura con:

- **contextIsolation**: true (renderer isolato da Node.js)
- **nodeIntegration**: false (nessun accesso diretto a Node)
- **contextBridge**: API tipizzata esposta tramite `window.api`

Tutte le operazioni database passano attraverso IPC handlers nel processo main.

## Tecnologie

- **Electron 33** - Framework desktop
- **Vite 6** - Build tool
- **React 19** - UI framework
- **better-sqlite3** - Database SQLite sincrono
- **Tailwind CSS 4** - Styling
- **shadcn/ui + Radix UI** - Componenti UI
- **react-router-dom 7** - Routing
- **Zod + React Hook Form** - Validazione form
