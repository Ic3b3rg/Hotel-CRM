// [PRELOAD] Electron preload script with contextBridge
// Espone un'API tipizzata al renderer mantenendo l'isolamento di contesto

console.log('[Preload] Script iniziato');

import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Electron importato', { contextBridge: !!contextBridge, ipcRenderer: !!ipcRenderer });
import type {
  IPCResponse,
  Buyer,
  Seller,
  Property,
  Deal,
  Activity,
  Tag,
  CreateBuyerRequest,
  UpdateBuyerRequest,
  BuyerFilters,
  CreateSellerRequest,
  UpdateSellerRequest,
  SellerFilters,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyFilters,
  CreateDealRequest,
  UpdateDealRequest,
  CreateActivityRequest,
  DashboardStats,
  DealStatus,
} from '../src/lib/types';

// [IPC] Channel constants (inline per evitare problemi di bundling)
const IPC_CHANNELS = {
  BUYERS_GET_ALL: 'buyers:getAll',
  BUYERS_GET_BY_ID: 'buyers:getById',
  BUYERS_CREATE: 'buyers:create',
  BUYERS_UPDATE: 'buyers:update',
  BUYERS_DELETE: 'buyers:delete',
  SELLERS_GET_ALL: 'sellers:getAll',
  SELLERS_GET_BY_ID: 'sellers:getById',
  SELLERS_CREATE: 'sellers:create',
  SELLERS_UPDATE: 'sellers:update',
  SELLERS_DELETE: 'sellers:delete',
  PROPERTIES_GET_ALL: 'properties:getAll',
  PROPERTIES_GET_BY_ID: 'properties:getById',
  PROPERTIES_GET_BY_SELLER: 'properties:getBySeller',
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_UPDATE: 'properties:update',
  PROPERTIES_DELETE: 'properties:delete',
  DEALS_GET_ALL: 'deals:getAll',
  DEALS_GET_BY_ID: 'deals:getById',
  DEALS_GET_BY_BUYER: 'deals:getByBuyer',
  DEALS_GET_BY_PROPERTY: 'deals:getByProperty',
  DEALS_CREATE: 'deals:create',
  DEALS_UPDATE: 'deals:update',
  DEALS_UPDATE_STATUS: 'deals:updateStatus',
  DEALS_DELETE: 'deals:delete',
  ACTIVITIES_GET_BY_DEAL: 'activities:getByDeal',
  ACTIVITIES_CREATE: 'activities:create',
  ACTIVITIES_DELETE: 'activities:delete',
  TAGS_GET_ALL: 'tags:getAll',
  TAGS_CREATE: 'tags:create',
  TAGS_DELETE: 'tags:delete',
  STATS_GET_DASHBOARD: 'stats:getDashboard',
  STATS_GET_STALE_DEALS: 'stats:getStaleDeals',
} as const;

// [API] Oggetto API esposto al renderer via contextBridge
const api = {
  // ============================================
  // BUYERS
  // ============================================
  buyers: {
    getAll: (filters?: BuyerFilters): Promise<IPCResponse<Buyer[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.BUYERS_GET_ALL, filters),

    getById: (id: string): Promise<IPCResponse<Buyer>> =>
      ipcRenderer.invoke(IPC_CHANNELS.BUYERS_GET_BY_ID, id),

    create: (data: CreateBuyerRequest): Promise<IPCResponse<Buyer>> =>
      ipcRenderer.invoke(IPC_CHANNELS.BUYERS_CREATE, data),

    update: (data: UpdateBuyerRequest): Promise<IPCResponse<Buyer>> =>
      ipcRenderer.invoke(IPC_CHANNELS.BUYERS_UPDATE, data),

    delete: (id: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.BUYERS_DELETE, id),
  },

  // ============================================
  // SELLERS
  // ============================================
  sellers: {
    getAll: (filters?: SellerFilters): Promise<IPCResponse<Seller[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SELLERS_GET_ALL, filters),

    getById: (id: string): Promise<IPCResponse<Seller>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SELLERS_GET_BY_ID, id),

    create: (data: CreateSellerRequest): Promise<IPCResponse<Seller>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SELLERS_CREATE, data),

    update: (data: UpdateSellerRequest): Promise<IPCResponse<Seller>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SELLERS_UPDATE, data),

    delete: (id: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SELLERS_DELETE, id),
  },

  // ============================================
  // PROPERTIES
  // ============================================
  properties: {
    getAll: (filters?: PropertyFilters): Promise<IPCResponse<Property[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_GET_ALL, filters),

    getById: (id: string): Promise<IPCResponse<Property>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_GET_BY_ID, id),

    getBySeller: (sellerId: string): Promise<IPCResponse<Property[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_GET_BY_SELLER, sellerId),

    create: (data: CreatePropertyRequest): Promise<IPCResponse<Property>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_CREATE, data),

    update: (data: UpdatePropertyRequest): Promise<IPCResponse<Property>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_UPDATE, data),

    delete: (id: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_DELETE, id),
  },

  // ============================================
  // DEALS
  // ============================================
  deals: {
    getAll: (): Promise<IPCResponse<Deal[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_ALL),

    getById: (id: string): Promise<IPCResponse<Deal>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_BY_ID, id),

    getByBuyer: (buyerId: string): Promise<IPCResponse<Deal[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_BY_BUYER, buyerId),

    getByProperty: (propertyId: string): Promise<IPCResponse<Deal[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_BY_PROPERTY, propertyId),

    create: (data: CreateDealRequest): Promise<IPCResponse<Deal>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_CREATE, data),

    update: (data: UpdateDealRequest): Promise<IPCResponse<Deal>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_UPDATE, data),

    updateStatus: (id: string, status: DealStatus): Promise<IPCResponse<Deal>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_UPDATE_STATUS, { id, status }),

    delete: (id: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEALS_DELETE, id),
  },

  // ============================================
  // ACTIVITIES
  // ============================================
  activities: {
    getByDeal: (dealId: string): Promise<IPCResponse<Activity[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITIES_GET_BY_DEAL, dealId),

    create: (data: CreateActivityRequest): Promise<IPCResponse<Activity>> =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITIES_CREATE, data),

    delete: (id: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITIES_DELETE, id),
  },

  // ============================================
  // TAGS
  // ============================================
  tags: {
    getAll: (): Promise<IPCResponse<Tag[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_GET_ALL),

    create: (name: string, color?: string): Promise<IPCResponse<Tag>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_CREATE, { name, color }),

    delete: (id: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_DELETE, id),
  },

  // ============================================
  // STATS
  // ============================================
  stats: {
    getDashboard: (): Promise<IPCResponse<DashboardStats>> =>
      ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_DASHBOARD),

    getStaleDeals: (days?: number): Promise<IPCResponse<Deal[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_STALE_DEALS, days),
  },
};

// [EXPOSE] Espone l'API al renderer in modo sicuro
try {
  console.log('[Preload] Esposizione API...');
  contextBridge.exposeInMainWorld('api', api);
  console.log('[Preload] API esposta con successo!');
} catch (error) {
  console.error('[Preload] ERRORE durante esposizione API:', error);
}

// Il tipo ElectronAPI è definito in src/vite-env.d.ts
