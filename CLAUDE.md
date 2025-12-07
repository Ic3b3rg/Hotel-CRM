# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HotelCRM Desktop is an offline-first desktop CRM application for hotel real estate transactions, built with Electron, React, and SQLite. The app manages buyers, sellers, properties, deals, and activities entirely offline with a local database.

## Commands

### Development
```bash
npm run dev:electron    # Start full Electron app with hot-reload (recommended)
npm run dev            # Start Vite dev server only (renderer without Electron)
```

### Build
```bash
npm run build          # Build for current platform
npm run build:mac      # Build for macOS (DMG + ZIP for x64 and arm64)
npm run build:win      # Build for Windows (NSIS installer + portable EXE)
```

### Type Checking & Linting
```bash
npm run typecheck      # Run TypeScript type checking without emitting
npm run lint          # Run ESLint on TypeScript/TSX files
```

## Architecture

### Process Model

This is a typical Electron three-process architecture:

1. **Main Process** ([electron/main.ts](electron/main.ts)) - Manages app lifecycle, window creation, and database initialization
2. **Preload Script** ([electron/preload.ts](electron/preload.ts)) - Security bridge that exposes typed IPC API to renderer via `contextBridge`
3. **Renderer Process** ([src/](src/)) - React application running in Chromium

**Security Model:**
- `contextIsolation: true` - Renderer cannot access Node.js APIs directly
- `nodeIntegration: false` - No direct Node.js access in renderer
- All database operations go through IPC handlers in main process
- API exposed via `window.api` with full TypeScript typing

### Database Layer

**Location:** [electron/database/](electron/database/)

- **connection.ts** - Database initialization, migration runner, connection management
- **migrations/** - SQL schema files executed in order (001_schema.sql, 002_optional_seller.sql)
- **repositories/** - Repository pattern implementation for each entity (CRUD operations)
  - **base.repository.ts** - Abstract base class with common functionality (UUID generation, transactions, count, exists)
  - **buyers.repository.ts** - Buyer operations including zone/tags/preferred types
  - **sellers.repository.ts** - Seller operations
  - **properties.repository.ts** - Property operations with seller relationships and tags
  - **deals.repository.ts** - Deal operations linking buyers/properties
  - **activities.repository.ts** - Activity operations for deal timeline
  - **tags.repository.ts** - Tag management

**Database Path:**
- Development: `./hotel-crm.db` (project root)
- Production macOS: `~/Library/Application Support/hotel-crm-desktop/hotel-crm.db`
- Production Windows: `%APPDATA%/hotel-crm-desktop/hotel-crm.db`
- Production Linux: `~/.config/hotel-crm-desktop/hotel-crm.db`

**Migration Strategy:**
- Migrations run on every app start (idempotent SQL with `IF NOT EXISTS`)
- If migration files missing in production, schema created inline from [connection.ts](electron/database/connection.ts#L93)
- Migration files copied to `resources/electron/database/migrations/` via `electron-builder.yml` extraResources

### IPC Communication

**Location:** [electron/ipc/](electron/ipc/)

- **channels.ts** - IPC channel name constants
- **handlers/** - Domain-specific IPC handlers that call repository methods
- **index.ts** - Central registration of all handlers

**Pattern:**
1. Renderer calls `window.api.buyers.create(data)`
2. Preload forwards to IPC channel via `ipcRenderer.invoke('buyers:create', data)`
3. Handler in main process receives request, calls repository method
4. Returns `IPCResponse<T>` with success/error structure

All IPC methods return `Promise<IPCResponse<T>>` for consistent error handling.

### React Layer

**Location:** [src/](src/)

**Routing:** React Router v7 with routes in [App.tsx](src/App.tsx):
- `/` - Dashboard (stats)
- `/compratori` - Buyers list/management
- `/venditori` - Sellers list/management
- `/immobili` - Properties list/management
- `/trattative` - Deals pipeline/management

**Hooks:** Custom hooks in [src/hooks/](src/hooks/) wrap IPC calls with React state:
- Each hook provides: `{ data, loading, error, create, update, delete, fetch }`
- Example: `useBuyers()` automatically fetches on mount, provides CRUD operations with optimistic updates
- Single entity hooks: `useBuyer(id)`, `useSeller(id)`, etc.

**Components:**
- [src/components/ui/](src/components/ui/) - shadcn/ui components (Radix UI primitives + Tailwind)
- [src/components/](src/components/) - Domain-specific components (forms, detail views, search)

### Type System

**Location:** [src/lib/types.ts](src/lib/types.ts)

**Key entities:**
- `Buyer` - Property buyers with budget, zones, preferred types, tags
- `Seller` - Property sellers with contact preferences
- `Property` - Hotels/accommodations with optional seller link (can exist without seller)
- `Deal` - Transaction between buyer and property (links buyer_id + property_id)
- `Activity` - Timeline entries for deals (notes, calls, emails, appointments)
- `Tag` - Labels for buyers/properties (many-to-many)

**Request/Response types:**
- All IPC responses wrapped in `IPCResponse<T>` with `{ success, data?, error? }`
- Create requests: `CreateBuyerRequest`, `CreateSellerRequest`, etc.
- Update requests: `UpdateBuyerRequest` (partial + id required), etc.
- Filter types for search/filtering

**Important:** Properties have an **optional** `sellerId` field. Properties can exist without sellers (added in migration 002_optional_seller.sql).

## Build & Bundling

**Vite Configuration** ([vite.config.ts](vite.config.ts)):
- `vite-plugin-electron` compiles main.ts and preload.ts separately
- Preload MUST be compiled as CommonJS (`.cjs`) for Electron compatibility
- `better-sqlite3` externalized (native module, bundled separately)
- Base path set to `'./'` for `file://` protocol in production

**Electron Builder** ([electron-builder.yml](electron-builder.yml)):
- Includes `dist/` (renderer), `dist-electron/` (main/preload), `node_modules/better-sqlite3/`
- `extraResources` copies migration SQL files for production
- Native module rebuilding enabled (`npmRebuild: true`)
- Generates DMG/ZIP for macOS (universal x64+arm64) and NSIS/portable for Windows

## Development Patterns

### Adding a New Entity

1. Add types to [src/lib/types.ts](src/lib/types.ts) (entity, create/update requests, filters)
2. Create repository in `electron/database/repositories/{entity}.repository.ts` extending `BaseRepository`
3. Add IPC channels to [electron/ipc/channels.ts](electron/ipc/channels.ts)
4. Create handler in `electron/ipc/handlers/{entity}.handler.ts`
5. Register handler in [electron/ipc/index.ts](electron/ipc/index.ts)
6. Add methods to API in [electron/preload.ts](electron/preload.ts)
7. Create React hook in `src/hooks/use-{entity}.ts`
8. Create UI components in `src/components/`
9. Add route to [src/App.tsx](src/App.tsx) if needed

### Database Changes

1. Create new migration file: `electron/database/migrations/00X_description.sql`
2. Add migration filename to array in [connection.ts](electron/database/connection.ts#L58)
3. Update inline schema in `createSchemaInline()` as fallback
4. If adding columns, ensure backward compatibility or use ALTER TABLE

### Common Gotchas

- **Preload must be CJS:** If preload fails to load, check it's compiled as `.cjs` (see [vite.config.ts](vite.config.ts#L49))
- **Migration files in production:** SQL files must be copied via `extraResources` in electron-builder config
- **better-sqlite3 is synchronous:** All DB operations are sync, wrapped in IPC async handlers
- **Foreign keys enabled:** `PRAGMA foreign_keys = ON` is set on connection
- **Repository transactions:** Use `runInTransaction()` for multi-step operations
- **IPC type safety:** Preload API is fully typed, but ensure types match between renderer/main

## Tech Stack

- **Electron 33** - Desktop framework
- **Vite 6** - Build tool with HMR
- **React 19** - UI framework
- **React Router 7** - Client-side routing
- **better-sqlite3** - Synchronous SQLite driver
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component system (Radix UI + Tailwind)
- **Zod** - Schema validation
- **React Hook Form** - Form state management
- **TypeScript 5.7** - Type system

## Italian Language Context

This application is designed for the Italian hotel real estate market. UI labels, types, and database content are in Italian:
- Property types: `hotel`, `b&b`, `affittacamere`, `residence`
- Deal statuses: `nuovo_contatto`, `in_corso`, `offerta_inviata`, `diligenza`, `chiuso_positivo`, `chiuso_negativo`
- Routes: `/compratori` (buyers), `/venditori` (sellers), `/immobili` (properties), `/trattative` (deals)
